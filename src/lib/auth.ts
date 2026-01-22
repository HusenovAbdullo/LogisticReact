// src/lib/auth.ts
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE ?? "sp_token";


type Role = "shop" | "admin" | undefined;

export async function getRoleSSR() {
  const c = await cookies();
  const role = c.get("role")?.value as Role;
  const shopOwner = c.get("shop_owner")?.value === "true";

  return {
    role: role ?? (shopOwner ? "shop" : "admin"),
    shopOwner,
  };
}

export async function hasAccessSSR() {
  const c = await cookies();
  return Boolean(c.get(AUTH_COOKIE_NAME)?.value);
}

export const hasAccessTokenSSR = hasAccessSSR;
