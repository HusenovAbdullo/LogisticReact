/* scripts/generate-openapi.mjs */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const PUBLIC_DIR = path.join(ROOT, "public");

// MUHIM: conflict bo‘lmasligi uchun nomni o‘zgartirdik
const OUT_FILE = path.join(PUBLIC_DIR, "openapi.full.json");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

/**
 * Next App Router API route path:
 * src/app/api/buyer/today-stats/route.ts  -> /api/buyer/today-stats
 */
function deriveInternalRoutePath(file) {
  const p = toPosix(file);
  const idx = p.indexOf("/src/app/api/");
  if (idx === -1) return null;

  const rel = p.slice(idx + "/src/app/api/".length);
  if (!/\/route\.(ts|tsx|js)$/.test(rel)) return null;

  const dir = rel.replace(/\/route\.(ts|tsx|js)$/, "");
  return "/api/" + dir;
}

function extractMethods(fileText) {
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(/g;
  const methods = new Set();
  let m;
  while ((m = re.exec(fileText))) methods.add(m[1]);
  return [...methods];
}

/**
 * Outgoing endpoint’larni ko‘proq topish uchun:
 * 1) serverFetch("..."), fetch("https://...") literal
 * 2) kod ichidagi "/api/v1/..." kabi yo‘llar (template string bo‘lsa ham)
 */
function findOutgoingCalls(tsText) {
  const found = [];

  // serverFetch("/api/v1/...")
  const reServerFetch = /\b(serverFetch|serverFetchInternal)\s*<[^>]*>\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = reServerFetch.exec(tsText))) {
    found.push({ kind: m[1], url: m[2] });
  }

  const reServerFetch2 = /\b(serverFetch|serverFetchInternal)\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((m = reServerFetch2.exec(tsText))) {
    found.push({ kind: m[1], url: m[2] });
  }

  // fetch("https://...")
  const reFetchAbs = /\bfetch\s*\(\s*["'`](https?:\/\/[^"'`]+)["'`]/g;
  while ((m = reFetchAbs.exec(tsText))) {
    found.push({ kind: "fetch", url: m[1] });
  }

  // "/api/v1/..." kabi yo‘llarni ham topamiz (template string bo‘lsa ham)
  const reApiPath = /(["'`])((?:\/api\/v\d+\/)[^"'`\s]+)\1/g;
  while ((m = reApiPath.exec(tsText))) {
    found.push({ kind: "apiPath", url: m[2] });
  }

  return found;
}

function buildOpenApi({ internal, outgoing }) {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Logistics API (full from code)",
      version: "1.0.0",
    },
    servers: [{ url: "/", description: "This app (Next.js)" }],
    paths: {},
    tags: [
      { name: "internal", description: "Next.js internal API routes (/api/...)" },
      { name: "outgoing", description: "Backend calls used by this app (discovered from code)" },
    ],
  };

  // internal
  for (const r of internal) {
    if (!spec.paths[r.path]) spec.paths[r.path] = {};
    for (const method of r.methods) {
      const lower = method.toLowerCase();
      spec.paths[r.path][lower] = {
        tags: ["internal"],
        summary: `${method} ${r.path}`,
        responses: { "200": { description: "OK" } },
      };
    }
  }

  // outgoing
  // (virtual path) /__outgoing__/api/v1/... ko‘rinishda chiqadi
  for (const o of outgoing) {
    const key = `/__outgoing__/${String(o.url).replace(/^\//, "")}`;
    if (!spec.paths[key]) spec.paths[key] = {};
    spec.paths[key]["get"] = {
      tags: ["outgoing"],
      summary: `USED OUTGOING: ${o.url}`,
      description:
        "Discovered from code. Real method/body may vary. Use Request Logs for real payloads.",
      responses: { "200": { description: "Upstream response" } },
    };
  }

  return spec;
}

function uniqBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, x);
  }
  return [...m.values()];
}

function main() {
  ensureDir(PUBLIC_DIR);

  // internal routes
  const apiDir = path.join(SRC, "app", "api");
  const routeFiles = walk(apiDir).filter((f) => /\/route\.(ts|tsx|js)$/.test(toPosix(f)));

  const internal = [];
  for (const f of routeFiles) {
    const p = deriveInternalRoutePath(f);
    if (!p) continue;
    const text = fs.readFileSync(f, "utf8");
    const methods = extractMethods(text);
    internal.push({ path: p, methods: methods.length ? methods : ["GET"] });
  }

  // outgoing calls
  const tsFiles = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
  let outgoing = [];

  for (const f of tsFiles) {
    const text = fs.readFileSync(f, "utf8");
    const found = findOutgoingCalls(text);

    for (const it of found) {
      // internal fetchlar chiqmasin:
      if (it.kind === "serverFetchInternal") continue;
      // faqat backendga tegishli bo‘lishi mumkin bo‘lganlar:
      outgoing.push({ url: it.url });
    }
  }

  outgoing = uniqBy(outgoing, (x) => x.url);

  const spec = buildOpenApi({
    internal: uniqBy(internal, (x) => x.path),
    outgoing,
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(spec, null, 2), "utf8");
  console.log(`OpenAPI generated: ${OUT_FILE}`);
  console.log(`Internal routes: ${internal.length}, Outgoing discovered: ${outgoing.length}`);
}

main();
