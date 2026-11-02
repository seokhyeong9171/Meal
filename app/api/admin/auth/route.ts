import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
