import { NextResponse } from "next/server";
import { getMenu } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ menu: await getMenu() });
  } catch {
    return NextResponse.json({ error: "식단을 불러오지 못했어요." }, { status: 500 });
  }
}
