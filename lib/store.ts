import { Redis } from "@upstash/redis";
import { SAMPLE_MENU } from "./sample";
import type { WeekMenu } from "./types";

const KEY = "menu:current";

const g = globalThis as unknown as { __menu?: WeekMenu };

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export async function getMenu(): Promise<WeekMenu | null> {
  const redis = getRedis();
  if (redis) return (await redis.get<WeekMenu>(KEY)) ?? null;
  // 저장소가 없는 로컬 개발 환경: 메모리 또는 샘플 데이터
  if (process.env.NODE_ENV !== "production") return g.__menu ?? SAMPLE_MENU;
  return null;
}

export async function saveMenu(menu: WeekMenu): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY, menu);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "저장소가 연결되지 않았어요. Vercel에서 Upstash Redis를 연결해 주세요.",
    );
  }
  g.__menu = menu;
}
