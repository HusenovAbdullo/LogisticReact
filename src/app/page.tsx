import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Root route (`/`) — token bo'lsa /dashboard, bo'lmasa /login
 */
export default async function HomePage() {
  const AUTH_COOKIE = process.env.AUTH_COOKIE || "sp_token";

  const c = await cookies(); // ✅ await kerak
  const access = c.get(AUTH_COOKIE)?.value;

  redirect(access ? "/dashboard" : "/login");
}
