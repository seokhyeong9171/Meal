import MenuView from "@/components/MenuView";
import { formatUpdatedKST, todayKST } from "@/lib/date";
import { getMenu } from "@/lib/store";
import type { WeekMenu } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let menu: WeekMenu | null = null;
  let failed = false;
  try {
    menu = await getMenu();
  } catch {
    failed = true;
  }

  if (!menu) {
    return (
      <main className="shell">
        <header className="top">
          <h1>본우리집밥</h1>
          <p>주간 메뉴</p>
        </header>
        <div className="empty">
          <p>
            {failed
              ? "식단을 불러오지 못했어요. 잠시 후 다시 열어 주세요."
              : "아직 등록된 식단표가 없어요."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <MenuView
      menu={menu}
      today={todayKST()}
      updated={formatUpdatedKST(menu.updatedAt)}
    />
  );
}
