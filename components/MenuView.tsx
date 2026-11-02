"use client";

import { useRef, useState } from "react";
import {
  MEAL_KEYS,
  MEAL_LABELS,
  type Day,
  type Meal,
  type MealKey,
  type WeekMenu,
} from "@/lib/types";

function md(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return { m, d };
}

function MealSection({
  label,
  time,
  meal,
  ramen,
  ramenNote,
}: {
  label: string;
  time?: string;
  meal: Meal;
  ramen?: string[];
  ramenNote?: string;
}) {
  return (
    <section className="meal" aria-label={label}>
      <header className="meal-head">
        <h3>{label}</h3>
        {time && <time>{time}</time>}
      </header>
      <div className="meal-body">
        <p className="main">{meal.main}</p>
        {meal.items.length > 0 && (
          <ul className="items">
            {meal.items.map((it, i) => (
              <li key={i} className={meal.highlights.includes(it) ? "hl" : undefined}>
                {it}
              </li>
            ))}
          </ul>
        )}
        {meal.plus.length > 0 && (
          <div className="corner plus">
            <span className="tag">PLUS</span>
            {meal.plus.map((it, i) => (
              <span key={i}>{it}</span>
            ))}
          </div>
        )}
        {ramen && ramen.length > 0 && (
          <div className="corner ramen">
            <span className="tag dark">셀프라면</span>
            {ramen.map((it, i) => (
              <span key={i}>{it}</span>
            ))}
            {ramenNote && <small>{ramenNote}</small>}
          </div>
        )}
      </div>
    </section>
  );
}

export default function MenuView({
  menu,
  today,
  updated,
}: {
  menu: WeekMenu;
  today: string;
  updated: string;
}) {
  const days = menu.days;
  const [idx, setIdx] = useState(() => {
    const i = days.findIndex((d) => d.date === today);
    return i >= 0 ? i : 0;
  });
  const touch = useRef<{ x: number; y: number } | null>(null);

  const day: Day = days[idx];
  const first = md(days[0].date);
  const last = md(days[days.length - 1].date);
  const hasToday = days.some((d) => d.date === today);
  const past = today > days[days.length - 1].date;
  const future = today < days[0].date;

  const go = (n: number) => setIdx((i) => Math.min(days.length - 1, Math.max(0, i + n)));

  const meals = MEAL_KEYS.filter((k) => day[k]) as MealKey[];

  return (
    <main
      className="shell"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? 1 : -1);
      }}
    >
      <header className="top">
        <h1>본우리집밥</h1>
        <p>
          주간 메뉴 {first.m}/{first.d} ~ {last.m}/{last.d}
        </p>
      </header>

      <div className="days" role="tablist" aria-label="요일 선택">
        {days.map((d, i) => {
          const { d: dd } = md(d.date);
          return (
            <button
              key={d.date}
              role="tab"
              aria-selected={i === idx}
              className={`day${d.date === today ? " today" : ""}`}
              onClick={() => setIdx(i)}
            >
              <small>{d.dow}</small>
              <b>{dd}</b>
            </button>
          );
        })}
      </div>

      <div className="content">
        {(past || future) && !hasToday && (
          <p className="notice-bar">
            {past ? "지난 주 식단표예요. 새 식단표가 올라오면 바뀌어요." : "다음 주 식단표예요."}
          </p>
        )}

        <div className="daytitle">
          <h2>
            {md(day.date).m}월 {md(day.date).d}일 {day.dow}요일
          </h2>
          {day.date === today && <span className="chip">오늘</span>}
        </div>

        {meals.length === 0 && <p className="empty-day">이 날은 등록된 식단이 없어요.</p>}

        {meals.map((k) => (
          <MealSection
            key={k}
            label={MEAL_LABELS[k]}
            time={menu.mealTimes[k]}
            meal={day[k] as Meal}
            ramen={k === "dinner" ? day.selfRamen : undefined}
            ramenNote={k === "dinner" ? menu.selfRamenNote : undefined}
          />
        ))}

        {menu.notices.length > 0 && (
          <footer className="notices">
            {menu.notices.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
            {updated && <p className="updated">{updated} 업데이트</p>}
          </footer>
        )}
      </div>
    </main>
  );
}
