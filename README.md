# 주간 식단표 사이트

식단표 사진을 올리면 AI(Claude)가 읽어서 요일별 메뉴로 보여주는 모바일 우선 사이트예요.

- `/` : 누구나 보는 주간 식단표 (오늘 요일이 자동 선택, 좌우로 밀어서 요일 이동)
- `/admin` : 비밀번호로 보호된 관리 화면 (사진 업로드 → 인식 결과 확인·수정 → 저장)

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY, ADMIN_PASSWORD 입력
npm run dev
```

저장소(Redis)를 연결하지 않은 로컬에서는 샘플 식단이 보이고, 저장하면 서버가 꺼질 때까지 메모리에만 유지돼요.

## GitHub + Vercel 배포

1. 이 폴더를 GitHub 저장소로 push
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<내계정>/<저장소>.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New → Project** → 방금 만든 저장소 import
3. **Environment Variables** 등록
   | 이름 | 값 |
   |---|---|
   | `ANTHROPIC_API_KEY` | Anthropic 콘솔에서 발급한 키 |
   | `ADMIN_PASSWORD` | 관리 화면 비밀번호 (길고 추측하기 어렵게) |
4. **Deploy**
5. 배포 후 프로젝트의 **Storage** 탭 → **Upstash Redis**(Marketplace) 생성 후 프로젝트에 연결
   (환경변수가 자동으로 들어와요) → **Redeploy** 한 번
6. `https://<내도메인>/admin` 에서 비밀번호 입력 → 식단표 사진 업로드 → 확인 → 저장

## 구조

```
app/page.tsx                   메인(서버에서 저장된 식단을 읽음)
components/MenuView.tsx        요일 탭 + 끼니별 화면
app/admin/AdminClient.tsx      업로드, 편집, 저장
app/api/admin/parse/route.ts   이미지 → Claude 비전 → 식단 JSON
app/api/admin/menu/route.ts    식단 저장 (비밀번호 필요)
lib/prompt.ts                  인식 프롬프트와 출력 스키마
lib/sample.ts                  샘플 식단 (로컬 개발용)
```

## 참고

- 모델은 기본 `claude-sonnet-5-5`이고, `ANTHROPIC_MODEL` 환경변수로 바꿀 수 있어요.
- 사진은 업로드 전에 브라우저에서 2400px 이하로 줄여요 (Vercel 요청 크기 제한 4.5MB 대비).
- 인식이 틀릴 수 있으니 저장 전에 꼭 확인하세요. 식단표 양식이 달라지면 `lib/prompt.ts`의 규칙을 고치면 돼요.
