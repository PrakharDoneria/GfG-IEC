# Deploying GFG IEC Student Chapter Portal to Vercel

## Overview
This guide walks you through deploying the **GFG IEC Student Chapter** web portal (Flask frontend + FastAPI backend) on **Vercel**. The project is structured as a classic Python web app with static assets under `static/` and Jinja2 templates under `templates/`.

---

## Prerequisites
1. **Vercel account** – sign up at https://vercel.com.
2. **Vercel CLI** installed globally:
   ```bash
   npm i -g vercel   # or yarn global add vercel
   ```
3. **Git** repository (Vercel deploys from a Git provider – GitHub, GitLab, Bitbucket).
4. **Python 3.8+** installed locally for testing.
5. **Supabase credentials** (or any DB you use) – you’ll need to set them as environment variables on Vercel.

---

## Project Structure (relevant parts)
```
GFG IEC/
├─ static/               # CSS, JS, images, assets
│   ├─ css/styles.css
│   └─ js/main.js
├─ templates/            # Jinja2 HTML templates
│   ├─ base.html
│   └─ index.html
├─ data/                 # JSON data files (events, courses, …)
├─ api_server.py         # FastAPI backend (runs on port 8001)
├─ main.py               # Flask entry‑point (runs on port 5000)
├─ requirements.txt
└─ vercel.json           # Vercel routing configuration
```

---

## 1. Add a `vercel.json` (already present)
Your existing `vercel.json` routes **all** requests to `main.py`:
```json
{
  "version": 2,
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [
    { "src": "/(.*)", "dest": "main.py" }
  ]
}
```
*The static route (`/static/(.*)`) was removed because Flask can serve static files directly via `url_for('static', ...)`.*

---

## 2. Install command
Vercel will run this command **once** during the build phase to install dependencies:
```bash
pip install -r requirements.txt
```
If you need a specific Python version, add a `runtime.txt` containing e.g. `python-3.11.0`.

---

## 3. Build command
The project does **not** require a compile‑time build step (no bundling). The build command can be a no‑op, but Vercel expects something. Use:
```bash
# No build step needed – just a placeholder
echo "Build step skipped"
```
(You can also leave the field empty in the Vercel dashboard.)

---

## 4. Output directory
Since this is a server‑side Python app, there is **no static output directory** like `dist/` or `public/`. Set the output directory to the project root (`.`) or leave it blank. Vercel will serve the Flask app directly.

---

## 5. Environment Variables (required)
Add the following variables in the Vercel dashboard → **Settings → Environment Variables** (choose *Production* and *Preview* as needed):
| Name | Value | Description |
|------|-------|-------------|
| `SUPABASE_URL` | `<your‑supabase‑project‑url>` | URL of your Supabase instance |
| `SUPABASE_KEY` | `<your‑supabase‑anon‑key>` | Public API key for Supabase |
| `PYTHONUNBUFFERED` | `1` | Ensures logs are streamed in real‑time |

---

## 6. Deploying
1. **Commit & push** your code to a Git repository (GitHub is the simplest).
2. In the terminal, from the project root, run:
   ```bash
   vercel
   ```
   - Follow the prompts: select the existing project or create a new one.
   - When asked for the **framework**, choose **Other** (or **Python** if listed).
   - Confirm the `vercel.json` configuration.
3. After the initial deployment finishes, you’ll receive a preview URL. To push to production, run:
   ```bash
   vercel --prod
   ```
4. Verify that:
   - `https://<your‑project>.vercel.app/` loads the homepage.
   - Static assets (CSS/JS) are correctly served (check Network tab).
   - API endpoints (e.g., `/api/events/upcoming`) respond (you can test via Postman or browser).

---

## 7. Common Pitfalls & Tips
- **Static files 404** – Ensure you are using `{{ url_for('static', filename='css/styles.css') }}` in your templates (already done). Do **not** hard‑code `/static/...` paths.
- **Port conflicts** – Vercel runs your app on an internal port; you **must not** call `app.run(port=5000)` in production. Modify `main.py` to detect the `PORT` env var:
  ```python
  import os
  port = int(os.getenv('PORT', 5000))
  app.run(host='0.0.0.0', port=port)
  ```
- **Subprocess for FastAPI** – The current `main.py` spawns `api_server.py`. This works locally but may cause issues on Vercel because only one process is allowed per function. A safer approach is to merge the FastAPI routes into the Flask app or expose them as a separate Vercel function under `api/`. For a quick deployment you can comment out the subprocess launch and rely on Flask‑only features.
- **Large assets** – Vercel has a 100 MB limit per deployment. Your `loading.webm` (~0.8 MB) is fine, but keep an eye on size.

---

## 8. TL;DR – Quick Commands
```bash
# 1. Install Vercel CLI (once)
npm i -g vercel

# 2. Add runtime (optional)
echo "python-3.11.0" > runtime.txt

# 3. Deploy (first time)
vercel   # follow prompts

# 4. Deploy to production
vercel --prod
```

---

That’s it! Your GFG IEC portal should now be live on Vercel, serving both the Flask frontend and the FastAPI‑backed leaderboard API.

*Happy coding!*
