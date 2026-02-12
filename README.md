<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your app

This contains everything you need to run locally and deploy on Vercel.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key
3. Set the Supabase env vars in [.env.local](.env.local):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel Project Settings -> Environment Variables, add:
   - `OPENAI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

Notes:
- Frontend is served from the Vite build output (`dist`).
- Tutor API is handled by Vercel Serverless Function at `api/tutor.js`.
