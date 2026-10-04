# Deep Connection — Open-Source Personal Matchmaking & Story Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-blue)](https://nextjs.org/docs/architecture/turbopack)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-00e9a3?logo=redis)](https://upstash.com/)
[![Cloudflare Turnstile](https://img.shields.io/badge/Cloudflare-Turnstile-f38020?logo=cloudflare)](https://dash.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Deep Connection** is a self-hostable, privacy-first personal matchmaking engine and storytelling platform. It cuts through the superficial swiping fatigue of dating apps and the rigid queues of traditional arranged marriage setups—prioritizing authentic craftsmanship, personal values, intent verification, and emotional maturity.

---

## ✨ Features

- **Multi-Tenant Story Realms (`/[slug]`)**: Every user gets an isolated, custom realm with their own story URL (`/[slug]/story`) and private dashboard (`/[slug]/admin`).
- **Live In-Context Visual Editor (WYSIWYG)**: Edit text, change bios, adjust height/lifestyle specs, and re-order sections with live visual feedback and auto-save.
- **Dynamic Modular Sections**:
  - **Dynamic Socials Manager**: Connect or remove LinkedIn, Tinder, GitHub, Instagram, X (Twitter), and personal portfolios with zero-whitespace fallbacks.
  - **Custom Craft Pillars**: Add or delete professional focus areas and engineering philosophies.
  - **Partnership Vision Pillars**: Define custom core values in an equal, modern partnership with automatic numbering.
  - **Visual Rhythm & Downtime**: Show proof of follow-through, active living, and daily habits.
- **1-Click Profile Import & Export**:
  - **Export JSON**: Download your entire story config as `realm-[slug]-profile.json` or copy it to your clipboard.
  - **Import JSON**: Upload any exported `.json` file or paste raw JSON to instantly restore or duplicate a profile.
  - **AI Prompt Generator**: Generate a complete, emotionally mature profile using ChatGPT, Claude, or Gemini in one prompt.
- **Attention & Dwell-Time Heatmap**: Uses passive `IntersectionObserver` to track dwell times per section, showing matchmakers where prospective partners spend the most attention and where drop-offs happen.
- **Cloudflare Turnstile Protection**: Frictionless, non-intrusive bot verification without requiring sign-ins or account creation.
- **Direct Encrypted Messaging**: Match notes are sent directly to your personal email inbox via Gmail SMTP with optional automated acknowledgment.
- **Client-Side & Server Sharp Image Optimization**: Automatically optimizes photos and auto-orients smartphone EXIF rotations.

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Clone the repository
git clone https://github.com/ajaymajukar/deep-connection.git
cd deep-connection/web

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚙️ Environment Variables (`web/.env.local`)

All services used have **generous, 100% free tiers**:

```env
# Upstash Redis (Free Serverless Redis: https://upstash.com)
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-secret-token"

# Cloudflare Turnstile (Free Captcha Alternative: https://dash.cloudflare.com)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"

# Gmail SMTP for Alerts & Notes (Optional)
SMTP_USER="youremail@gmail.com"
SMTP_PASS="your-16-character-gmail-app-password"
NOTIFICATION_TO="youremail@gmail.com"

# Global Admin Passkey (Optional fallback)
ADMIN_SECRET="your-secure-passkey"
```

---

## 📦 How to Deploy Live on Vercel (Free)

1. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/deep-connection.git
   git branch -M master
   git push -u origin master
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New..."** → **"Project"**.
   - Import your `deep-connection` repository.
   - ⚠️ **Important**: In the project settings, set **Root Directory** to `web`.
   - Add your environment variables under **Environment Variables**.
   - Click **Deploy**.

3. **Domain & Cloudflare Turnstile**:
   - In Cloudflare Turnstile, add your Vercel URL (e.g. `your-project.vercel.app`) to your widget's **Allowed Domains** list.

---

## 🛠️ Customizing Your Profile

### Option 1: Visual Editor (Easiest)
1. Go to `https://your-domain.com/[slug]/admin` and enter your passkey.
2. Edit any field, upload photos, or add social links directly on the canvas.
3. Click **Save Changes**.

### Option 2: 1-Click JSON Import/Export
1. In the admin editor, click **Export JSON** to download a backup file `realm-[slug]-profile.json`.
2. When deploying to a new database or realm, click **Import Profile** → **Upload .json** and select your file.
3. Click **Apply Profile** → **Save Changes**.

### Option 3: AI Prompt Generator
1. In the editor, click **Import Profile** → **AI Prompt Generator**.
2. Copy the pre-filled prompt into ChatGPT / Claude / Gemini along with your raw thoughts, resume, or old dating bio.
3. Paste the generated JSON output back into the editor.

---

## 🔒 Privacy & Architecture

- **Isolated Storage**: Each realm is partitioned in Redis under `realm:<slug>:profile` and `realm:<slug>:meta`.
- **Zero-Surname Privacy**: Built-in privacy controls keep your full legal identity protected until mutual trust is established.
- **No Search Indexing**: Default `robots.txt` and meta headers prevent search engine scraping.

---

## 📄 License

MIT © [Ajay Majukar](https://github.com/ajaymajukar)
