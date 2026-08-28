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
- [x] שלב 1: שלד PWA סטטי (HTML/CSS/manifest/SW) - נבדק מקומית (SW פעיל, RTL תקין, ללא שגיאות קונסול). פריסה בפועל ל-GitHub Pages דורשת הפעלת "Deploy from GitHub Actions" ב-Settings → Pages (ראו "Current Focus"). **בעבודה כרגע: שלב 2**
- [ ] שלב 2: Worker חילוץ טקסט (`/api/extract`) + זרימת הדבקה ידנית
- [ ] שלב 3: אינטגרציית Groq (`/api/decode`) + היסטוריה
- [ ] שלב 4: Web Share Target
- [ ] שלב 5: ליטוש PWA + נגישות
- [ ] שלב 6: מסמכים משפטיים (`docs/legal/`)

## Current Focus
שלבים 0-1 הושלמו. עוברים לשלב 2 (Worker לחילוץ טקסט + זרימת הדבקה ידנית). עדיין דרושים מהמשתמש (לא חוסם את תחילת הקוד, אך דרוש לפני שהעיבוד יעבוד בפועל):
- מפתח API של Groq (מ-console.groq.com) - יוגדר כ-secret ב-Cloudflare Worker, לא בקוד (דרוש בשלב 3).
- חשבון Cloudflare + `CLOUDFLARE_API_TOKEN` כ-GitHub secret (ליצירת ה-Worker ופריסתו, דרוש משלב 2 ואילך).
- הפעלת "Settings → Pages → Source: GitHub Actions" בריפו כדי שפריסת `public/` תעבוד בפועל.
- החלטה על אופן פריסת GitHub Pages (דומיין מותאם אישית מול נתיב משנה `username.github.io/clickbyter/`).

## החלטה שהתבטלה
תוכנית קודמת לאפליקציית ארגון קישורי סרטונים (YouTube/Facebook עם Supabase+Google Auth) בוטלה לגמרי לפי בקשת המשתמש - לא רלוונטית יותר.
