import { NextResponse } from "next/server";
import { readLogs, LogDirection, RequestLogItem } from "@/lib/request-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

function cleanBaseUrl(u: string) {
  return (u || "").replace(/\/+$/, "");
}

const BACKEND_BASE = cleanBaseUrl(BACKEND_URL);

function tryParseUrl(u: string) {
  // u relative bo‘lsa ("/api/...") URL constructorga origin kerak
  try {
    if (u.startsWith("http://") || u.startsWith("https://")) return new URL(u);
    return new URL(u, "http://localhost"); // dummy origin
  } catch {
    return null;
  }
}

function guessSchema(v: any): any {
  if (v === null || v === undefined) return { nullable: true };
  if (Array.isArray(v)) return { type: "array", items: v[0] ? guessSchema(v[0]) : {} };
  const t = typeof v;
  if (t === "string") return { type: "string" };
  if (t === "number") return { type: "number" };
  if (t === "boolean") return { type: "boolean" };
  if (t === "object") {
    const props: any = {};
    for (const k of Object.keys(v)) props[k] = guessSchema(v[k]);
    return { type: "object", properties: props };
  }
  return {};
}

function buildQueryParams(samples: RequestLogItem[]) {
  // log.url dan query key’larni topib, Swagger param list qilamiz
  const set = new Set<string>();
  for (const s of samples) {
    const parsed = tryParseUrl(s.url);
    if (!parsed) continue;
    for (const [k] of parsed.searchParams.entries()) set.add(k);
  }
  return Array.from(set).map((name) => ({
    name,
    in: "query",
    required: false,
    schema: { type: "string" },
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") ?? "all").toLowerCase(); // all | backend | internal

  const logs = readLogs();

  const filtered = logs.filter((x) => {
    const parsed = tryParseUrl(x.url);

    if (scope === "backend") {
      if (x.direction !== "outgoing") return false;
      if (!parsed) return false;
      // backend origin mos kelishi
      const origin = parsed.origin;
      return BACKEND_BASE ? origin === BACKEND_BASE : true;
    }

    if (scope === "internal") {
      if (x.direction !== "incoming") return false;
      // ichki api: /api/... bo‘lsa
      return x.url.startsWith("/api/");
    }

    return true;
  });

  // endpointlar: method + pathname bo‘yicha guruh
  const map = new Map<string, { pathname: string; method: string; samples: RequestLogItem[]; tag: string }>();

  for (const x of filtered) {
    const parsed = tryParseUrl(x.url);
    const pathname = parsed ? parsed.pathname : x.url.split("?")[0] || x.url;
    const method = x.method.toUpperCase();

    const tag = x.direction === "outgoing" ? "backend" : "internal";
    const key = `${method} ${pathname} ${tag}`;

    if (!map.has(key)) map.set(key, { pathname, method, samples: [], tag });
    map.get(key)!.samples.push(x);
  }

  const paths: any = {};
  for (const v of map.values()) {
    const m = v.method.toLowerCase();
    if (!paths[v.pathname]) paths[v.pathname] = {};

    const last = v.samples[v.samples.length - 1];
    const params = buildQueryParams(v.samples);

    const reqSchema =
      v.method === "GET" || v.method === "HEAD" ? undefined : last?.reqBody ? guessSchema(last.reqBody) : undefined;

    const resSchema = last?.resBody ? guessSchema(last.resBody) : undefined;

    paths[v.pathname][m] = {
      tags: [v.tag],
      summary: v.tag === "backend" ? "Backend API (from outgoing logs)" : "Internal API (from incoming logs)",
      parameters: params.length ? params : undefined,
      requestBody: reqSchema
        ? {
            required: false,
            content: {
              "application/json": {
                schema: reqSchema,
                example: last.reqBody,
              },
            },
          }
        : undefined,
      responses: {
        [String(last?.status ?? 200)]: {
          description: "Response (from logs)",
          content: resSchema
            ? {
                "application/json": {
                  schema: resSchema,
                  example: last.resBody,
                },
              }
            : undefined,
        },
      },
    };
  }

  const servers =
    scope === "backend" && BACKEND_BASE
      ? [{ url: BACKEND_BASE, description: "Backend" }]
      : [{ url: "/", description: "This app" }];

  return NextResponse.json(
    {
      openapi: "3.0.0",
      info: { title: "Logistics API (from logs)", version: "1.0.0" },
      servers,
      paths,
    },
    { status: 200 },
  );
}
