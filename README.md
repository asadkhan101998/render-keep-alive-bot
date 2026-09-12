# 🚀 Render Keep-Alive Poke Bot (Playwright + GitHub Actions)

A **100% Free ($0.00 / month forever)** automated keep-alive mechanism to prevent Render free web services from spinning down.

---

## ⚡ Why This Is Needed
- **Render Inactivity Rule**: Free web services on Render go to sleep after **15 minutes** of no HTTP traffic.
- **Cold Boot Delay**: Waking up a sleeping app takes **30–60 seconds**, causing slow first loads for users.
- **Render Free Tier Quota**: Provides **750 free instance hours/month** (A full 31-day month is 744 hours, meaning **1 free service can run 24/7 for $0.00** without extra cost).
- **Solution**: This bot pings your site every **12 minutes** using a real Playwright headless browser or fast HTTP request, ensuring it stays active 24/7.

---

## 🛠️ Setup in 3 Simple Steps

### Step 1: Clone / Push this Repo to GitHub
Create a new repository on GitHub and push this code:
```bash
git init
git add .
git commit -m "Initial commit: Render Keep-Alive Poker"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 2: Add Your Render App URL to GitHub Secrets
1. Go to your GitHub repository on `github.com`.
2. Navigate to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret**.
4. Set:
   - **Name**: `TARGET_URLS`
   - **Value**: `https://your-app-name.onrender.com` *(If you have multiple URLs, separate them by commas: `https://app1.onrender.com,https://app2.onrender.com`)*
5. Click **Add secret**.

### Step 3: Test the Action
1. In your GitHub repository, click on the **Actions** tab.
2. Under "Render Keep-Alive Poke Bot", click **Run workflow** → **Run workflow**.
3. Verify that the workflow runs green ✅ and logs the HTTP response.
4. **Done!** GitHub Actions will now automatically wake and poke your app every 12 minutes on the cloud.

---

## 💻 Running Locally (Optional)

If you want to test or run it on your own machine:

### 1. Single Test Run
```bash
# Set your URL in .env or run with environment variable
npm run poke
```

### 2. Fast HTTP Request Mode (Playwright API Context)
```bash
npm run poke:request
```

### 3. Background Daemon Mode (Keeps pinging every 12 mins locally)
```bash
npm run poke:daemon
```

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TARGET_URLS` | `https://your-app-name.onrender.com` | Comma-separated list of target URLs |
| `TIMEOUT_MS` | `90000` (90s) | Max wait time for cold-start wakeups |
| `MAX_RETRIES` | `3` | Number of retry attempts on error |
| `POKE_MODE` | `browser` | `browser` (full Chromium engine) or `request` (fast API ping) |
| `DAEMON_INTERVAL_MINUTES` | `12` | Interval in minutes for local loop mode |

---

## 💰 Cost Breakdown
- **GitHub Actions**: 100% Free (Unlimited minutes for public repos, 2,000 mins/month for private).
- **Render Service**: 100% Free (750 free hours / month covers 1 service 24/7).
- **Total Cost**: **$0.00 / month forever**.
