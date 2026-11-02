import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";
import { normalizeMenu } from "@/lib/normalize";
import { MENU_TOOL, SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageType = (typeof TYPES)[number];

export async function POST(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았어요." },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지 파일이 없어요." }, { status: 400 });
  }
  if (!TYPES.includes(file.type as ImageType)) {
    return NextResponse.json({ error: "JPG, PNG, WEBP 이미지만 올릴 수 있어요." }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "이미지가 너무 커요. (4MB 이하)" }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [MENU_TOOL],
      tool_choice: { type: "tool", name: MENU_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type as ImageType, data },
            },
            { type: "text", text: "이 주간 식단표를 읽어서 save_menu로 제출해 주세요." },
          ],
        },
      ],
    });
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      throw new Error("식단을 읽지 못했어요.");
    }
    return NextResponse.json({ menu: normalizeMenu(block.input) });
  } catch (e) {
    console.error("parse failed", e);
    const message = e instanceof Error ? e.message : "이미지를 분석하지 못했어요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
