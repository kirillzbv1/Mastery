# Deploy Mastery to Vercel (5 minutes)

## Step 1 — Install Vercel CLI
```
npm install -g vercel
```

## Step 2 — Deploy
From the `accountability-pwa` folder:
```
vercel --prod
```
Follow the prompts. When asked about framework: select **Other**.

## Step 3 — Add your Anthropic API key
1. Go to vercel.com → your project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
3. Redeploy: `vercel --prod`

## Step 4 — Open on your phone
Open your Vercel URL in Safari → Share → Add to Home Screen

That's it. Mentor will now respond using full AI.
