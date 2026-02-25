# 🌍 Wanderplan — Trip Planner + Calendar

A full-featured trip planning app built with React + Vite.  
Plan trips, manage flights, hotels, and day-by-day itineraries — all in one calendar view.

---

## 📁 Project Structure

```
wanderplan/
├── index.html            ← App entry point
├── vite.config.js        ← Vite bundler config
├── package.json          ← Dependencies & scripts
├── .gitignore
├── .vscode/
│   ├── settings.json     ← Editor settings
│   └── extensions.json   ← Recommended VS Code extensions
└── src/
    ├── main.jsx          ← React DOM root
    └── App.jsx           ← Entire app (components, data, logic)
```

---

## 🖥️ STEP 1 — Run Locally in VS Code

### Prerequisites
Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v18 or higher) — check: `node -v`
- [VS Code](https://code.visualstudio.com/)

### Setup

```bash
# 1. Open the wanderplan folder in VS Code
#    File → Open Folder → select wanderplan/

# 2. Open the integrated terminal in VS Code
#    Terminal → New Terminal  (or Ctrl+` / Cmd+`)

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open your browser at: **http://localhost:5173**

The app hot-reloads automatically when you save changes to any file.

### Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build for production (outputs to `/dist`) |
| `npm run preview` | Preview production build locally |

---

## ☁️ STEP 2 — Deploy to the Cloud

Choose any of these options. **Vercel is the easiest** (recommended for beginners).

---

### 🥇 Option A — Vercel (Easiest, Free)

**Best for:** Beginners. Zero config. Auto-deploys when you push to GitHub.

#### One-time setup:

**1. Push your code to GitHub**
```bash
# In your project folder (terminal):
git init
git add .
git commit -m "Initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/wanderplan.git
git push -u origin main
```

**2. Deploy on Vercel**
1. Go to [vercel.com](https://vercel.com) → Sign up free with GitHub
2. Click **"Add New Project"**
3. Select your `wanderplan` repository
4. Vercel auto-detects Vite — click **"Deploy"**
5. ✅ Done! Your app is live at `https://wanderplan.vercel.app`

**Auto-deploy:** Every time you push to GitHub, Vercel redeploys automatically.

```bash
# After making changes:
git add .
git commit -m "Update trip planner"
git push
# → Vercel auto-deploys in ~30 seconds
```

---

### 🥈 Option B — Netlify (Also Free, Also Easy)

**Best for:** Alternative to Vercel with similar features.

#### Deploy via drag-and-drop (no GitHub needed):

```bash
# Build the app first:
npm run build
# This creates a /dist folder
```

1. Go to [netlify.com](https://netlify.com) → Sign up free
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag your `/dist` folder into the upload area
4. ✅ Live at `https://your-site.netlify.app`

#### Or connect to GitHub (auto-deploys):
1. Netlify → **"Add new site"** → **"Import from Git"**
2. Connect GitHub → select your repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click **Deploy**

---

### 🥉 Option C — GitHub Pages (Free, Slightly More Setup)

**Best for:** Developers who want everything in GitHub.

**1. Install the GitHub Pages plugin:**
```bash
npm install --save-dev gh-pages
```

**2. Update `vite.config.js`:**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/wanderplan/',  // ← Add this line (must match your repo name)
})
```

**3. Add deploy scripts to `package.json`:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

**4. Push to GitHub & deploy:**
```bash
git add .
git commit -m "Add gh-pages config"
git push

npm run deploy
```

5. In your GitHub repo: **Settings → Pages → Branch: gh-pages**
6. ✅ Live at `https://YOUR_USERNAME.github.io/wanderplan/`

---

### 🏢 Option D — Your Own Server (VPS / Advanced)

**Best for:** Full control, custom domain, private hosting.

```bash
# On your server (Ubuntu/Debian):

# 1. Build locally
npm run build

# 2. Copy /dist to your server
scp -r dist/ user@your-server.com:/var/www/wanderplan/

# 3. On the server — install nginx
sudo apt install nginx

# 4. Create nginx config
sudo nano /etc/nginx/sites-available/wanderplan
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/wanderplan;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# 5. Enable the site
sudo ln -s /etc/nginx/sites-available/wanderplan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Add HTTPS with Let's Encrypt (free SSL)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🌐 Custom Domain (Any Hosting)

Once deployed on Vercel/Netlify:

1. Buy a domain at [Namecheap](https://namecheap.com) or [Cloudflare](https://cloudflare.com)
2. In Vercel/Netlify dashboard → **Domains → Add domain**
3. Add the DNS records they show you (usually a CNAME or A record)
4. Wait 5–30 min for DNS to propagate
5. ✅ Live at `https://yourdomain.com`

---

## 🔧 Customizing the App

All the code lives in **`src/App.jsx`**. Here's where to find key sections:

| What to change | Where in App.jsx |
|---------------|-----------------|
| Sample trip data | `INIT_TRIPS` array at the top |
| Color palette | `COLORS_TRIP` array |
| Trip emojis | `EMOJIS_TRIP` array |
| Activity types | `TYPE_META` object |
| App name | Search for `"Wanderplan"` |
| Fonts | The `G` CSS string at top (Google Fonts import) |

---

## 📦 Adding Features Later

| Feature | Package to install |
|---------|------------------|
| Save data between sessions | `npm install zustand` + localStorage |
| Backend / database | Supabase (free): [supabase.com](https://supabase.com) |
| User login / auth | `npm install @supabase/supabase-js` |
| Maps integration | `npm install leaflet react-leaflet` |
| Drag-and-drop itinerary | `npm install @dnd-kit/core` |
| Date picker UI | `npm install react-datepicker` |
| PDF export | `npm install jspdf html2canvas` |

---

## 🆘 Troubleshooting

**`npm install` fails:**
```bash
node -v   # Must be v18+
npm -v    # Must be v9+
```

**App shows blank page after deploying:**
- Check browser console for errors (F12)
- If using GitHub Pages, make sure `base` in `vite.config.js` matches your repo name

**Changes not showing after deploy:**
- Hard refresh browser: `Ctrl+Shift+R` / `Cmd+Shift+R`
- Clear browser cache

**Port 5173 already in use:**
```bash
npm run dev -- --port 3000
```

---

## 📬 Support

Built with React 18 + Vite 5. No backend required — runs entirely in the browser.

For questions, open an issue on your GitHub repo or consult the docs:
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Vercel Docs](https://vercel.com/docs)
