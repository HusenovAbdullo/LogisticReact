import { appendLog } from "@/lib/request-logger";

function maskHeaders(h: Headers) {
  const out: Record<string, string> = {};
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (key === "authorization") out[k] = "Bearer ***";
    else if (key === "cookie") out[k] = "***";
    else out[k] = v;
  }
  return out;
}

async function readReqBodySafe(req: Request) {
  const m = req.method.toUpperCase();
  if (m === "GET" || m === "HEAD") return undefined;

  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) return await req.clone().json();
    if (ct.includes("text/")) return await req.clone().text();
    return { __skipped: true, contentType: ct };
  } catch {
    return undefined;
  }
}

async function readResBodySafe(res: Response) {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) return await res.clone().json();
    if (ct.includes("text/")) return await res.clone().text();
    return { __skipped: true, contentType: ct };
  } catch {
    return undefined;
  }
}

export function withApiLogger(
  handler: (req: Request, ctx: any) => Promise<Response>,
) {
  return async (req: Request, ctx: any) => {
    const start = Date.now();
    const url = new URL(req.url);

    const reqBody = await readReqBodySafe(req);

    try {
      const res = await handler(req, ctx);
      const duration_ms = Date.now() - start;
      const resBody = await readResBodySafe(res);

      appendLog({
        direction: "incoming",
        method: req.method,
        url: url.pathname + url.search,
        status: res.status,
        duration_ms,
        reqHeaders: maskHeaders(req.headers),
        reqBody,
        resHeaders: Object.fromEntries(res.headers.entries()),
        resBody,
      });

      return res;
    } catch (e: any) {
      const duration_ms = Date.now() - start;

      appendLog({
        direction: "incoming",
        method: req.method,
        url: url.pathname + url.search,
        duration_ms,
        reqHeaders: maskHeaders(req.headers),
        reqBody,
        error: e?.message ?? "handler_error",
      });

      throw e;
    }
  };
}
