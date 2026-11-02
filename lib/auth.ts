import { timingSafeEqual } from "crypto";

/** x-admin-password 헤더를 ADMIN_PASSWORD 환경변수와 비교합니다. */
export async function checkAdmin(req: Request): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  const given = req.headers.get("x-admin-password") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected ?? "");
  const ok = !!expected && a.length === b.length && timingSafeEqual(a, b);
  if (!ok) await new Promise((r) => setTimeout(r, 600)); // 무차별 대입 완화
  return ok;
}
