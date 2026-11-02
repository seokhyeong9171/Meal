import { MEAL_KEYS, type Day, type Meal, type WeekMenu } from "./types";

const DOW = "일월화수목금토";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "11/02", "11-2", "2026-11-02" → YYYY-MM-DD. 연도가 없으면 오늘과 가장 가까운 해로 추정 */
export function resolveDate(input: string, now = new Date()): string | null {
  const full = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (full) {
    const [y, m, d] = [+full[1], +full[2], +full[3]];
    return m >= 1 && m <= 12 && d >= 1 && d <= 31 ? iso(y, m, d) : null;
  }
  const md = input.match(/(\d{1,2})\s*[-/.월]\s*(\d{1,2})/);
  if (!md) return null;
  const m = +md[1];
  const d = +md[2];
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const y = now.getUTCFullYear();
  let best = iso(y, m, d);
  let bestDiff = Infinity;
  for (const yy of [y - 1, y, y + 1]) {
    const diff = Math.abs(Date.UTC(yy, m - 1, d) - now.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = iso(yy, m, d);
    }
  }
  return best;
}

export function dowOf(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function normalizeMeal(v: unknown): Meal | null {
  if (!isObj(v)) return null;
  let main = str(v.main);
  const items = strList(v.items);
  const plus = strList(v.plus);
  const highlights = strList(v.highlights);
  if (!main && items.length === 0 && plus.length === 0) return null;
  if (!main) main = items.shift() ?? "";
  return { main, items, plus, highlights };
}

/** AI 응답이나 관리자 입력을 검증하고 정리합니다. */
export function normalizeMenu(raw: unknown, now = new Date()): WeekMenu {
  if (!isObj(raw) || !Array.isArray(raw.days)) {
    throw new Error("식단 데이터 형식이 올바르지 않아요.");
  }
  const days: Day[] = [];
  for (const d of raw.days) {
    if (!isObj(d)) continue;
    const date = resolveDate(str(d.date), now);
    if (!date) continue;
    days.push({
      date,
      dow: dowOf(date),
      breakfast: normalizeMeal(d.breakfast),
      lunch: normalizeMeal(d.lunch),
      dinner: normalizeMeal(d.dinner),
      selfRamen: strList(d.selfRamen),
    });
  }
  if (days.length === 0) throw new Error("날짜가 있는 식단을 찾지 못했어요.");
  days.sort((a, b) => a.date.localeCompare(b.date));

  const times = isObj(raw.mealTimes) ? raw.mealTimes : {};
  const mealTimes: WeekMenu["mealTimes"] = {};
  for (const k of MEAL_KEYS) {
    const t = str(times[k]);
    if (t) mealTimes[k] = t;
  }

  return {
    days,
    mealTimes,
    selfRamenNote: str(raw.selfRamenNote),
    notices: strList(raw.notices),
    updatedAt: now.toISOString(),
  };
}
