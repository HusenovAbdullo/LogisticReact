import { uid } from "./storage";

export function nowIso() {
  return new Date().toISOString();
}

export function base(prefix: string) {
  const t = nowIso();
  return { id: uid(prefix), createdAt: t, updatedAt: t };
}
