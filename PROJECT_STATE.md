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
- [x] שלב 1: שלד PWA סטטי (HTML/CSS/manifest/SW) - נבדק מקומית (SW פעיל, RTL תקין, ללא שגיאות קונסול). פריסה בפועל ל-GitHub Pages דורשת הפעלת "Deploy from GitHub Actions" ב-Settings → Pages (ראו "Current Focus").
- [x] שלב 2: Worker לחילוץ טקסט (`/api/extract` זמני) + זרימת הדבקה ידנית - נבדק עם `wrangler dev` מקומית: ראוטינג/CORS/הגנת SSRF/שרשרת נפילה (readability→og→raw-paragraphs) כולם עובדים נכון, וה-UI מציג תוצאה/שגיאה כמצופה (נבדק עם Playwright, כולל mock לתשובת ה-API).
- [x] שלב 3: אינטגרציית Groq (`groq.ts`, מוזג ל-`/api/decode` יחיד) + היסטוריה - נבדק: קריאת Groq מדומה (הצלחה/RATE_LIMITED/מפתח שגוי/תשובה ריקה), כרטיס תשובה+קישור סופי מוצג נכון, פריט נשמר ומופיע ב-`localStorage` (נבדק שההיסטוריה שורדת רענון עמוד), וכפתור "נקה היסטוריה" עובד (`history-section.hidden` הופך ל-true נכון כשאין פריטים).
- [x] שלב 4: Web Share Target - `share_target` נוסף ל-manifest, `url-extract.js`/`share-target.js` נבדקו ביחידה (כולל תרחיש פייסבוק - קישור בתוך `text` חופשי, לא ב-`url`), ונבדק end-to-end עם Playwright: נחיתה עם פרמטרי שיתוף ממלאת את שדה הקישור, מעבדת אוטומטית, מנקה את ה-query string מה-URL bar (`replaceState`), ומוסיפה להיסטוריה. **הבדיקה האמיתית (התקנה בפועל + שיתוף מאפליקציית Android אמיתית) לא ניתנת לביצוע מתוך סשן זה - דורשת מכשיר Android אמיתי לאחר פריסה.** **בעבודה כרגע: שלב 5**
- [ ] שלב 2: Worker חילוץ טקסט (`/api/extract`) + זרימת הדבקה ידנית
- [ ] שלב 3: אינטגרציית Groq (`/api/decode`) + היסטוריה
- [ ] שלב 4: Web Share Target
- [x] שלב 5: ליטוש PWA + נגישות - הוחלף `disabled` על כפתור השליחה ב-`aria-busy` + דגל מניעת שליחה כפולה (שומר על יכולת פוקוס בזמן עיבוד - נבדק שהפוקוס לא "נופל" ל-body בזמן טעינה), נוסף `role="status"` לאזור ההודעות ו-`aria-live="polite"` לאזור התוצאה, `text-align:end` במקום `right` בשדה הקישור (נכונות RTL לוגית), ונוספו `:focus-visible` outlines. נבדקו יחסי ניגודיות (WCAG) לכל צירופי הצבעים - כולם עוברים AA (הטקסט המושתק והשגיאה גם עוברים AAA כמעט). נבדק סדר Tab הגיוני עם Playwright.
- [ ] שלב 6: מסמכים משפטיים (`docs/legal/`)

## Current Focus
שלבים 0-5 הושלמו. עוברים לשלב 6 (מסמכים משפטיים) - השלב האחרון בתוכנית. עדיין דרושים מהמשתמש (לא חוסם את תחילת הקוד, אך דרוש לפני שהעיבוד יעבוד בפועל מול Groq אמיתי):
- מפתח API של Groq (מ-console.groq.com) - יוגדר כ-secret ב-Cloudflare Worker (`wrangler secret put GROQ_API_KEY`), לא בקוד. **טרם סופק - העיבוד לא יעבוד מול Groq אמיתי בלעדיו.**
- חשבון Cloudflare + `CLOUDFLARE_API_TOKEN` כ-GitHub secret (ליצירת ה-Worker ופריסתו בפועל דרך `deploy-worker.yml`).
- הפעלת "Settings → Pages → Source: GitHub Actions" בריפו כדי שפריסת `public/` תעבוד בפועל.
- לאחר הפריסה הראשונה של ה-Worker: לעדכן את `API_BASE_URL` ב-`public/js/api-client.js` מ-`http://localhost:8792` לכתובת האמיתית (`https://clickbyter-api.<subdomain>.workers.dev` או דומיין מותאם), ואת `ALLOWED_ORIGIN` ב-`worker/wrangler.toml` לכתובת ה-Pages האמיתית.
- החלטה על אופן פריסת GitHub Pages (דומיין מותאם אישית מול נתיב משנה `username.github.io/clickbyter/`).

### הערה חשובה: מגבלת רשת בסביבת הפיתוח הנוכחית
בסביבת ה-sandbox של הסשן הזה, גישת רשת יוצאת (egress) חסומה לרוב האינטרנט (מותרים רק registry.npmjs.org, GitHub, ועוד כמה דומיינים ספציפיים) - **לא ניתן לבדוק כאן שליפה אמיתית של כתבות מאתרי חדשות בפועל** (גם `workers.cloudflare.com` חסום, כך שגם פריסה בפועל ל-Cloudflare לא אפשרית מתוך הסשן הזה). לכן: לוגיקת החילוץ (`worker/src/extract.ts`) נבדקה ביחידה (unit test) עם HTML מדומה בעברית שמדמה כתבת קליקבייט אמיתית - שרשרת הנפילה readability→og→raw-paragraphs עובדת נכון. הבדיקה נגד אתרי חדשות אמיתיים (פייוולים, אתרי SPA וכו') חייבת להתבצע לאחר פריסה אמיתית (מהמחשב של המשתמש או דרך GitHub Actions), לא מתוך סשן זה.

## החלטה שהתבטלה
תוכנית קודמת לאפליקציית ארגון קישורי סרטונים (YouTube/Facebook עם Supabase+Google Auth) בוטלה לגמרי לפי בקשת המשתמש - לא רלוונטית יותר.
