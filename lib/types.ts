export type MealKey = "breakfast" | "lunch" | "dinner";

export const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner"];
export const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: "조식",
  lunch: "중식",
  dinner: "석식",
};

export type Meal = {
  /** 그날 끼니의 대표 메뉴 (표에서 맨 위에 크게 적힌 메뉴) */
  main: string;
  /** 나머지 메뉴 (밥, 국, 반찬, 김치) */
  items: string[];
  /** PLUS 코너 */
  plus: string[];
  /** 빨간 글씨 등 강조된 메뉴 */
  highlights: string[];
};

export type Day = {
  /** YYYY-MM-DD */
  date: string;
  /** 월 화 수 목 금 토 일 */
  dow: string;
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  /** 셀프라면 코너 토핑 (석식) */
  selfRamen: string[];
};

export type WeekMenu = {
  days: Day[];
  mealTimes: Partial<Record<MealKey, string>>;
  selfRamenNote: string;
  notices: string[];
  updatedAt: string;
};
