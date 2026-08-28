# Project State - Clickbyter

אפליקציית PWA שמפענחת כתבות "קליקבייט": משתפים/מדביקים קישור, האפליקציה קוראת את הכתבה במקום המשתמש ומציגה רק את התשובה הקצרה שהכותרת הסתירה + קישור למקור.

תוכנית מלאה: `/root/.claude/plans/https-play-google-com-store-apps-details-dapper-quilt.md` (בסביבת התכנון; אינו חלק מה-repo).

## החלטות מפתח (סופיות)
- שם האפליקציה/ריפו: **Clickbyter** (ריפו שונה שם מ-`vidfolder` ל-`clickbyter` ב-GitHub).
- פלטפורמה: PWA, ללא build step - HTML/CSS/JS גולמיים ב-`public/`, פריסה ל-GitHub Pages.
- Backend: Cloudflare Worker (`worker/`) - היחיד שיודע ליצור קריאות רשת ל-Groq ולכתבות חיצוניות (הגנת CORS + secrets).
- מנוע AI: **Groq** (chat completions, OpenAI-compatible API), לא Claude/OpenAI/Gemini - נבחר לעלות $0.
- הוספת קישורים: הדבקה ידנית (ברירת מחדל, תמיד זמינה) + Web Share Target (Android בלבד, לאחר התקנה).
- פלט: תשובה קצרה בלבד + קישור למקור. בלי סיכום מלא.
- היסטוריה: localStorage בלבד, בלי חשבונות, בלי סנכרון בין מכשירים.

## התקדמות (Milestones)
- [x] תוכנית אושרה על ידי המשתמש
- [x] שינוי שם ריפו ל-`clickbyter` (בוצע ע"י המשתמש ב-GitHub)
- [x] שלב 0: שלד פרויקט (קבצי תשתית, מבנה תיקיות)
- [x] שלב 1: שלד PWA סטטי (HTML/CSS/manifest/SW) - נבדק מקומית (SW פעיל, RTL תקין, ללא שגיאות קונסול)
- [x] שלב 2: Worker לחילוץ טקסט (מוזג בהמשך ל-`/api/decode`) - ראוטינג/CORS/הגנת SSRF/שרשרת נפילה (readability→og→raw-paragraphs) נבדקו ועובדים נכון
- [x] שלב 3: אינטגרציית Groq (`groq.ts`, `/api/decode` יחיד) + היסטוריה - נבדק: הצלחה/RATE_LIMITED/מפתח שגוי/תשובה ריקה, כרטיס תשובה+קישור, `localStorage` שורד רענון עמוד, "נקה היסטוריה" עובד
- [x] שלב 4: Web Share Target - `share_target` ב-manifest, חילוץ URL מטקסט חופשי (כולל תרחיש פייסבוק), נבדק end-to-end עם Playwright (כולל ניקוי query string וטעינה אוטומטית)
- [x] שלב 5: ליטוש PWA + נגישות - `aria-busy` במקום `disabled` (שימור פוקוס), `role="status"`, `aria-live`, `:focus-visible`, ניגודיות WCAG AA נבדקה לכל הצבעים, סדר Tab נבדק
- [x] שלב 6: מסמכים משפטיים (`docs/legal/`) - 4 קבצי Markdown בעברית פורמלית, עם `[PLACEHOLDER]` בשדות ספציפיים לבעל/ת האפליקציה

**כל 6 שלבי התוכנית המאושרת הושלמו.**
- [x] מיזוג הענף ל-`main` (PR #1) + תיקון גרסת Node ב-`deploy-worker.yml` מ-20 ל-22 (PR #2, ראו למטה) - **פריסת ה-Worker ל-Cloudflare הצליחה בפועל**.

## Current Focus
המשתמש נמצא באמצע תהליך הפריסה בפועל, בהדרכה צעד-צעד (דרך הדפדפן בנייד):

- [x] מפתח Groq API - נוצר ונשמר אצל המשתמש.
- [x] חשבון Cloudflare + Token (`CLOUDFLARE_API_TOKEN`) - נוצר ונוסף כ-GitHub secret.
- [x] מיזוג ל-`main` (PR #1) + תיקון Node 20→22 ב-`deploy-worker.yml` (PR #2).
- [x] **פריסת ה-Worker ל-Cloudflare הצליחה** - אמור להופיע ב-Cloudflare Dashboard בשם `clickbyter-api`.

נותרו:
1. **הוספת `GROQ_API_KEY` ל-Worker** - עכשיו שה-Worker קיים ב-Cloudflare, אפשר להוסיף את זה ישירות דרך ה-Dashboard (Workers & Pages → clickbyter-api → Settings → Variables and Secrets → Add), בלי צורך ב-CLI.
2. **GitHub Pages**: לוודא/להפעיל Settings → Pages → Source: GitHub Actions בריפו `clickbyter`.
3. **עדכון כתובות אחרי איתור כתובת ה-Worker בפועל**:
   - `public/js/api-client.js`: `API_BASE_URL` מ-`http://localhost:8792` לכתובת האמיתית של ה-Worker.
   - `worker/wrangler.toml`: `ALLOWED_ORIGIN` מ-`http://localhost:8791` לכתובת ה-GitHub Pages האמיתית.
4. **מסמכים משפטיים**: מילוי שדות ה-`[PLACEHOLDER]` ב-`docs/legal/*.md`.
5. **בדיקה אמיתית על Android**: התקנה + שיתוף אמיתי - לא ניתן לבצע מתוך סשן זה.
6. **החלטה על נתיב פריסה**: דומיין מותאם אישית מול `username.github.io/clickbyter/`.

### הערה חשובה: מגבלת רשת בסביבת הפיתוח הנוכחית
בסביבת ה-sandbox של הסשן הזה, גישת רשת יוצאת (egress) חסומה לרוב האינטרנט (מותרים רק registry.npmjs.org, GitHub, ועוד כמה דומיינים ספציפיים) - **לא ניתן היה לבדוק כאן שליפה אמיתית של כתבות מאתרי חדשות בפועל**, וגם לא לפרוס בפועל ל-Cloudflare (`workers.cloudflare.com` חסום גם הוא). לכן: לוגיקת החילוץ (`worker/src/extract.ts`) ולוגיקת Groq (`worker/src/groq.ts`) נבדקו ביחידה (unit tests) עם HTML/תשובות מדומות, וה-UI נבדק מקצה לקצה מול ה-worker המקומי (`wrangler dev`) עם mocking ל-API. הבדיקה נגד אתרי חדשות אמיתיים (פייוולים, אתרי SPA וכו') ומול Groq אמיתי חייבת להתבצע לאחר פריסה אמיתית (מהמחשב של המשתמש או דרך GitHub Actions), לא מתוך סשן זה.

## החלטה שהתבטלה
תוכנית קודמת לאפליקציית ארגון קישורי סרטונים (YouTube/Facebook עם Supabase+Google Auth) בוטלה לגמרי לפי בקשת המשתמש - לא רלוונטית יותר.
