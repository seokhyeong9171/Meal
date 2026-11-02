"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MEAL_KEYS,
  MEAL_LABELS,
  type Day,
  type Meal,
  type MealKey,
  type WeekMenu,
} from "@/lib/types";

type Msg = { type: "ok" | "err"; text: string } | null;

const emptyMeal = (): Meal => ({ main: "", items: [], plus: [], highlights: [] });
const lines = (s: string) => s.split("\n");

/** 폰 사진은 용량이 커서 업로드 전에 줄입니다 (Vercel 요청 제한 4.5MB 대비). */
async function resizeImage(file: File, maxSide = 2400): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리하지 못했어요.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지를 처리하지 못했어요."))),
      "image/jpeg",
      0.88,
    ),
  );
}

export default function AdminClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [menu, setMenu] = useState<WeekMenu | null>(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState<"" | "auth" | "parse" | "save">("");
  const [msg, setMsg] = useState<Msg>(null);

  const headers = { "x-admin-password": pw };

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy("auth");
    setMsg(null);
    try {
      const res = await fetch("/api/admin/auth", { method: "POST", headers });
      if (!res.ok) throw new Error("비밀번호가 맞지 않아요.");
      setAuthed(true);
      const cur = await fetch("/api/menu").then((r) => r.json()).catch(() => null);
      if (cur?.menu) setMenu(cur.menu);
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "로그인하지 못했어요." });
    } finally {
      setBusy("");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("parse");
    setMsg(null);
    try {
      const blob = await resizeImage(file);
      const body = new FormData();
      body.append("image", blob, "menu.jpg");
      const res = await fetch("/api/admin/parse", { method: "POST", headers, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "이미지를 분석하지 못했어요.");
      setMenu(json.menu);
      setIdx(0);
      setMsg({ type: "ok", text: "식단표를 읽었어요. 내용을 확인하고 고친 뒤 저장하세요." });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "분석에 실패했어요." });
    } finally {
      setBusy("");
    }
  }

  async function save() {
    if (!menu) return;
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "저장하지 못했어요.");
      setMenu(json.menu);
      setMsg({ type: "ok", text: "저장했어요. 메인 화면에 바로 반영돼요." });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "저장에 실패했어요." });
    } finally {
      setBusy("");
    }
  }

  const patchDay = (i: number, patch: Partial<Day>) =>
    setMenu((m) => m && { ...m, days: m.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const patchMeal = (i: number, k: MealKey, patch: Partial<Meal> | null) =>
    setMenu((m) => {
      if (!m) return m;
      const days = m.days.map((d, j) => {
        if (j !== i) return d;
        if (patch === null) return { ...d, [k]: null };
        return { ...d, [k]: { ...(d[k] ?? emptyMeal()), ...patch } };
      });
      return { ...m, days };
    });

  if (!authed) {
    return (
      <main className="shell admin">
        <header className="top">
          <h1>식단표 관리</h1>
          <p>관리자 비밀번호를 입력하세요.</p>
        </header>
        <form className="panel" onSubmit={login}>
          <label>
            비밀번호
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn primary" disabled={busy === "auth"}>
            {busy === "auth" ? "확인 중" : "들어가기"}
          </button>
          {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
        </form>
      </main>
    );
  }

  const day = menu?.days[idx];

  return (
    <main className="shell admin">
      <header className="top">
        <h1>식단표 관리</h1>
        <p>
          <Link href="/" className="toplink">
            메인 화면 보기
          </Link>
        </p>
      </header>

      <div className="panel">
        <label className="btn primary filebtn">
          {busy === "parse" ? "식단표를 읽는 중이에요 (최대 1분)" : "식단표 사진 올리기"}
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy !== ""}
            hidden
          />
        </label>
        <p className="hint">사진을 올리면 새 식단표로 읽어서 아래에 보여줘요. 저장하기 전까지는 공개되지 않아요.</p>
        {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
      </div>

      {menu && day && (
        <>
          <div className="days" role="tablist" aria-label="요일 선택">
            {menu.days.map((d, i) => (
              <button
                key={d.date}
                role="tab"
                aria-selected={i === idx}
                className="day"
                onClick={() => setIdx(i)}
              >
                <small>{d.dow}</small>
                <b>{Number(d.date.slice(8))}</b>
              </button>
            ))}
          </div>

          <div className="content">
            {MEAL_KEYS.map((k) => {
              const meal = day[k];
              return (
                <section className="panel" key={k}>
                  <div className="row">
                    <h3>{MEAL_LABELS[k]}</h3>
                    {meal ? (
                      <button className="btn small" onClick={() => patchMeal(idx, k, null)}>
                        이 끼니 지우기
                      </button>
                    ) : (
                      <button className="btn small" onClick={() => patchMeal(idx, k, {})}>
                        추가
                      </button>
                    )}
                  </div>
                  {meal && (
                    <>
                      <label>
                        대표 메뉴
                        <input value={meal.main} onChange={(e) => patchMeal(idx, k, { main: e.target.value })} />
                      </label>
                      <label>
                        나머지 메뉴 (한 줄에 하나)
                        <textarea
                          rows={Math.max(3, meal.items.length + 1)}
                          value={meal.items.join("\n")}
                          onChange={(e) => patchMeal(idx, k, { items: lines(e.target.value) })}
                        />
                      </label>
                      <label>
                        PLUS 코너 (한 줄에 하나)
                        <textarea
                          rows={Math.max(2, meal.plus.length + 1)}
                          value={meal.plus.join("\n")}
                          onChange={(e) => patchMeal(idx, k, { plus: lines(e.target.value) })}
                        />
                      </label>
                      <label>
                        빨간 글씨로 강조할 메뉴 (한 줄에 하나)
                        <textarea
                          rows={2}
                          value={meal.highlights.join("\n")}
                          onChange={(e) => patchMeal(idx, k, { highlights: lines(e.target.value) })}
                        />
                      </label>
                    </>
                  )}
                </section>
              );
            })}

            <section className="panel">
              <label>
                셀프라면 토핑 (한 줄에 하나)
                <textarea
                  rows={2}
                  value={day.selfRamen.join("\n")}
                  onChange={(e) => patchDay(idx, { selfRamen: lines(e.target.value) })}
                />
              </label>
            </section>

            <section className="panel">
              <h3>공통 정보 (모든 요일에 표시)</h3>
              {MEAL_KEYS.map((k) => (
                <label key={k}>
                  {MEAL_LABELS[k]} 시간
                  <input
                    value={menu.mealTimes[k] ?? ""}
                    placeholder="예: 12:00 ~ 12:40"
                    onChange={(e) =>
                      setMenu({ ...menu, mealTimes: { ...menu.mealTimes, [k]: e.target.value } })
                    }
                  />
                </label>
              ))}
              <label>
                셀프라면 안내
                <input
                  value={menu.selfRamenNote}
                  onChange={(e) => setMenu({ ...menu, selfRamenNote: e.target.value })}
                />
              </label>
              <label>
                하단 안내문 (한 줄에 하나)
                <textarea
                  rows={5}
                  value={menu.notices.join("\n")}
                  onChange={(e) => setMenu({ ...menu, notices: lines(e.target.value) })}
                />
              </label>
            </section>

            <button className="btn primary save" onClick={save} disabled={busy !== ""}>
              {busy === "save" ? "저장 중" : "저장하고 공개하기"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
