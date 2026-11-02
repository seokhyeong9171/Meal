import type Anthropic from "@anthropic-ai/sdk";

export const SYSTEM_PROMPT = `당신은 한국 식당·급식소의 주간 식단표 이미지를 읽어 구조화된 데이터로 옮기는 도우미입니다.

규칙:
- 이미지에 적힌 한국어 메뉴명을 보이는 그대로 옮기세요. 임의로 바꾸거나 메뉴를 지어내지 마세요.
- 글자가 흐려 확신이 없으면 가장 그럴듯한 글자로 옮기되, 빈칸이나 "?" 같은 표시는 넣지 마세요.
- 식단표는 보통 요일(열) x 끼니(행: 조식/중식/석식) 구조입니다. 날짜는 "MM-DD" 형식으로 적으세요(예: 11/02 → "11-02").
- 각 끼니에서:
  - main: 해당 요일 칸의 맨 위, 가장 눈에 띄게 적힌 대표 메뉴 한 가지.
  - items: 그 아래 나머지 메뉴를 위에서 아래 순서대로 모두(밥, 국, 반찬, 김치 포함).
  - plus: 같은 요일의 "PLUS 코너" 칸에 적힌 메뉴들.
  - highlights: 다른 색(예: 빨간 글씨)으로 강조된 메뉴가 있으면 그 이름. 없으면 빈 배열.
- 식사 칸이 비어 있거나 시간 안내만 적혀 있는 끼니는 생략하세요.
- selfRamen: 요일별 "셀프라면" 코너의 토핑. selfRamenNote: 셀프라면 코너 하단의 공통 안내 문구(있으면).
- mealTimes: 조식/중식/석식 운영 시간(있으면).
- notices: 원산지, 알레르기, 식단 변경 안내, 행사·이벤트 문구 등 표 하단이나 여백의 안내문을 짧은 문장 단위로. 로고, 마스코트, 장식은 무시하세요.
- 반드시 save_menu 도구를 호출해 결과를 제출하세요.`;

const mealSchema = {
  type: "object",
  properties: {
    main: { type: "string" },
    items: { type: "array", items: { type: "string" } },
    plus: { type: "array", items: { type: "string" } },
    highlights: { type: "array", items: { type: "string" } },
  },
  required: ["main", "items"],
};

export const MENU_TOOL: Anthropic.Tool = {
  name: "save_menu",
  description: "식단표 이미지에서 읽은 주간 식단을 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "MM-DD" },
            breakfast: mealSchema,
            lunch: mealSchema,
            dinner: mealSchema,
            selfRamen: { type: "array", items: { type: "string" } },
          },
          required: ["date"],
        },
      },
      mealTimes: {
        type: "object",
        properties: {
          breakfast: { type: "string" },
          lunch: { type: "string" },
          dinner: { type: "string" },
        },
      },
      selfRamenNote: { type: "string" },
      notices: { type: "array", items: { type: "string" } },
    },
    required: ["days"],
  },
};
