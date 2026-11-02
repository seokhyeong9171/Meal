import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";
import { normalizeMenu } from "@/lib/normalize";
import { saveMenu } from "@/lib/store";

export async function PUT(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }
  try {
    const menu = normalizeMenu(await req.json());
    await saveMenu(menu);
    return NextResponse.json({ menu });
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장하지 못했어요.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
