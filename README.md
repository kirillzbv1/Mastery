# Mastery — Personal Accountability App

A premium dark-mode PWA for IB recruiting, PE sourcing, and daily discipline.

## Deploy in 3 steps

### Step 1 — Push to GitHub
```bash
cd mastery-app
git init
git add .
git commit -m "Initial deploy"
gh repo create mastery-app --public --push --source=.
```
(If you don't have `gh`, create a repo at github.com/new and follow the push instructions)

### Step 2 — Deploy to Vercel
```bash
npx vercel --prod
```
- When asked "Set up and deploy?" → Y
- "Which scope?" → your account
- "Link to existing project?" → N
- "Project name?" → mastery-app
- "Directory?" → ./
- Done — Vercel gives you a live URL

### Step 3 — Add your API key
- Go to vercel.com → your project → Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
- Redeploy: `npx vercel --prod`

## Making changes without redownloading
Edit any file, then run:
```bash
git add . && git commit -m "update" && git push
```
Vercel auto-deploys in ~20 seconds. Your phone gets the update next time you open the app.

## Install on iPhone
1. Open your Vercel URL in Safari
2. Tap Share → Add to Home Screen
3. Done — it's a full PWA, works offline
