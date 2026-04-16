# DeadlineOS — Deploy to the Web (Render + Atlas)

Complete click-by-click guide to get DeadlineOS running on a public URL you can share with your professor and classmates. Everything is free — no credit card required.

Total time: ~30 minutes.

---

## STEP 1: Create a GitHub Account & Repository

You need your code on GitHub so Render can pull and deploy it.

### 1A — Install Git (if you don't have it)

Open a terminal and run:

```bash
git --version
```

If it says "command not found":

- **macOS**: Run `xcode-select --install` and follow the prompt
- **Windows**: Download from https://git-scm.com and install (accept all defaults)
- **Linux**: Run `sudo apt install git`

### 1B — Create a GitHub account

1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Verify your email

### 1C — Push DeadlineOS to GitHub

1. Go to https://github.com/new
2. Repository name: `DeadlineOS`
3. Keep it **Public** (so Render can access it for free)
4. Do NOT check "Add a README" (we already have code)
5. Click **"Create repository"**
6. GitHub shows you the quick setup commands. Open your terminal and run:

```bash
cd path/to/DeadlineOS
git init
git add .
git commit -m "Initial commit - DeadlineOS MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/DeadlineOS.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username. When prompted, enter your GitHub credentials (or use a personal access token — GitHub will guide you).

After this, refresh your GitHub repo page — you should see all the files.

---

## STEP 2: Set Up MongoDB Atlas (Free Cloud Database)

### 2A — Create an account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email (free)
3. Choose the **FREE M0 tier** when asked

### 2B — Create a cluster

1. After signing in, click **"Build a Database"** (or "Create" if you see that)
2. Select **M0 FREE** tier
3. Provider: **AWS**
4. Region: Pick the closest to you (e.g., `us-east-1` for US, `ap-south-1` for India)
5. Cluster name: `deadlineos-cluster` (or leave default)
6. Click **"Create Deployment"**

### 2C — Create a database user

A dialog appears asking you to create a database user:

1. Authentication: **Password**
2. Username: `deadlineos_admin`
3. Password: Click **"Autogenerate Secure Password"**
4. **COPY THIS PASSWORD NOW** — you won't see it again. Save it in a notes app.
5. Click **"Create Database User"**

### 2D — Allow network access from anywhere

1. In the same dialog (or go to **Network Access** in the left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (this adds `0.0.0.0/0`)
4. Click **"Confirm"**

This is safe because your database is still password-protected.

### 2E — Get your connection string

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Drivers"**
4. Copy the connection string. It looks like:

```
mongodb+srv://deadlineos_admin:<password>@deadlineos-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<password>` with the password you copied in step 2C
6. Add the database name before the `?`:

```
mongodb+srv://deadlineos_admin:YOUR_PASSWORD@deadlineos-cluster.xxxxx.mongodb.net/deadlineos?retryWrites=true&w=majority
```

7. Save this full string — this is your `MONGODB_URI`

---

## STEP 3: Set Up Google Cloud (OAuth + Gmail API)

### 3A — Create a Google Cloud project

1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click the project dropdown at the top → **"New Project"**
4. Project name: `DeadlineOS`
5. Click **"Create"**
6. Wait a few seconds, then make sure **DeadlineOS** is selected in the project dropdown

### 3B — Enable the APIs

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search bar, type **Gmail API**
3. Click on **Gmail API** → click the blue **"Enable"** button
4. Go back to the Library
5. Search for **Google People API** → click it → **"Enable"**

### 3C — Configure the OAuth consent screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"** (left sidebar)
2. Select **"External"** → click **"Create"**
3. Fill in these fields:
   - App name: `DeadlineOS`
   - User support email: Select your email
   - Scroll to bottom → Developer contact email: Type your email
4. Click **"Save and Continue"**
5. On the **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - In the filter box, paste each of these one at a time and check them:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click **"Update"** at the bottom
6. Click **"Save and Continue"**
7. On the **Test users** page:
   - Click **"+ Add Users"**
   - Type your Gmail address (and your professor's Gmail if you want them to test it)
   - Click **"Add"**
   - **IMPORTANT**: While the app is in "Testing" mode, ONLY these emails can log in. Add everyone who needs to try the app here.
8. Click **"Save and Continue"** → **"Back to Dashboard"**

### 3D — Create OAuth credentials

1. Go to **"APIs & Services"** → **"Credentials"** (left sidebar)
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `DeadlineOS Web`
5. Under **Authorized JavaScript origins**, click **"+ Add URI"** and add:
   - `http://localhost:5000`
   - (Leave the second one empty for now — we'll add the Render URL in Step 5)
6. Under **Authorized redirect URIs**, click **"+ Add URI"** and add:
   - `http://localhost:5000/api/auth/google/callback`
   - (We'll add the Render URL here too in Step 5)
7. Click **"Create"**
8. A popup shows your **Client ID** and **Client Secret**
9. **Copy both** and save them somewhere safe. You need these in the next step.

---

## STEP 4: Deploy to Render

### 4A — Create a Render account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (this makes connecting your repo easier)

### 4B — Create a Web Service

1. From the Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if prompted
3. Find and select your **DeadlineOS** repository
4. Click **"Connect"**

### 4C — Configure the service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `deadlineos` |
| **Region** | Pick the closest to you |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | `Node` |
| **Build Command** | `npm run render:build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### 4D — Add environment variables

Scroll down to **"Environment Variables"** and click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your Atlas connection string from Step 2E |
| `GOOGLE_CLIENT_ID` | Your Client ID from Step 3D |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret from Step 3D |
| `GOOGLE_REDIRECT_URI` | `https://deadlineos.onrender.com/api/auth/google/callback` |
| `JWT_SECRET` | Generate one — open a terminal and run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — paste the output |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://deadlineos.onrender.com` |

**IMPORTANT about the URL**: If your service name is `deadlineos`, the URL will be `https://deadlineos.onrender.com`. If that name is taken, Render will append random characters (like `deadlineos-abc1`). Check the URL shown at the top of your service page and update `GOOGLE_REDIRECT_URI` and `FRONTEND_URL` accordingly.

### 4E — Deploy

1. Click **"Create Web Service"**
2. Render will start building your app. This takes **3–5 minutes** the first time.
3. Watch the build logs. You should see:
   - `npm run render:build` installing dependencies
   - React building the frontend
   - "Build successful"
4. Once deployed, Render shows a green **"Live"** badge and your URL

Your app is now live at: **`https://deadlineos.onrender.com`**

**Note about free tier**: The free tier spins down after 15 minutes of inactivity. The first visit after inactivity takes ~30 seconds to wake up. This is normal and fine for demos.

---

## STEP 5: Update Google Cloud with Your Live URL

Now that you have your Render URL, go back to Google Cloud Console to authorize it.

### 5A — Add the production redirect URI

1. Go to https://console.cloud.google.com
2. Navigate to **"APIs & Services"** → **"Credentials"**
3. Click on your **"DeadlineOS Web"** OAuth client
4. Under **Authorized JavaScript origins**, click **"+ Add URI"** and add:
   - `https://deadlineos.onrender.com` (your actual Render URL)
5. Under **Authorized redirect URIs**, click **"+ Add URI"** and add:
   - `https://deadlineos.onrender.com/api/auth/google/callback`
6. Click **"Save"**

### 5B — Add test users who will try the app

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Scroll down to **"Test users"**
3. Click **"+ Add Users"**
4. Add the Gmail addresses of everyone who should be able to log in:
   - Your professor's email
   - Your teammates' emails
   - Anyone else who will demo it
5. Click **"Save"**

**You can add up to 100 test users**. They will see a "This app isn't verified" warning when they first log in — tell them to click **"Continue"** (or "Advanced" → "Go to DeadlineOS"). This is normal for apps in testing mode.

---

## STEP 6: Test Your Live App

1. Open your Render URL: `https://deadlineos.onrender.com`
   (First load may take ~30 seconds if the server was sleeping)
2. Click **"Sign in with Google"**
3. Sign in with one of the test user accounts
4. Click **"Continue"** past the "unverified app" warning
5. Grant the Gmail read permissions
6. You should land on the dashboard
7. Click **"Sync Gmail"** to pull in deadlines from emails
8. Click **"+ Add Task"** to create a manual task
9. Verify the color-coded priority badges work (red/yellow/green)

### Send yourself a test email to verify extraction

Send an email to your own Gmail from any account with this body:

```
Subject: CS301 - Final Project Submission

Hi class,

The final project for CS301 is due May 5, 2026.
Please submit your code and report through the portal.

Thanks,
Professor Smith
```

Then click **"Sync Gmail"** again. You should see a new task appear: "CS301 - Final Project Submission" with the deadline of May 5.

---

## STEP 7: Share with Your Professor

Send them this message (customize as needed):

> Hi Professor,
>
> I built a web app called DeadlineOS that automatically extracts assignment deadlines from student emails. You can try it here:
>
> **https://deadlineos.onrender.com**
>
> Sign in with your Google account — I've already added your email as a test user. You'll see a "This app isn't verified" warning; just click "Continue" to proceed. The app only reads emails (read-only) and doesn't store any email content — only extracted deadline dates.
>
> The app also has manual task entry if you want to test that feature.

---

## Troubleshooting Common Issues

**Build fails on Render**
→ Check the build logs for errors. Most common: a missing dependency. Make sure all files are committed to GitHub (`git add . && git commit -m "fix" && git push`). Render auto-redeploys on push.

**"redirect_uri_mismatch" error**
→ The URL in your `GOOGLE_REDIRECT_URI` env var must EXACTLY match what's in Google Cloud Console. Check for typos, missing `https://`, or extra trailing slashes. Both must be identical.

**"Access blocked: This app's request is invalid"**
→ Your Render URL is not listed in the Google OAuth Authorized redirect URIs. Go back to Step 5A.

**"Error 403: access_denied — The developer hasn't given you access"**
→ The person trying to log in is not in the test users list. Go to Step 5B and add their Gmail.

**"This app isn't verified" warning**
→ This is normal and expected. Tell users to click "Advanced" → "Go to DeadlineOS (unsafe)". It's not actually unsafe — Google just shows this for apps that haven't gone through their verification process.

**App loads but shows blank page or errors**
→ Open browser developer tools (F12) → Console tab. If you see CORS errors, make sure `FRONTEND_URL` in Render env vars matches your actual URL exactly.

**"Sync Gmail" returns 0 tasks**
→ Normal if your recent emails don't contain deadline keywords. Send yourself the test email from Step 6 and sync again.

**App takes 30 seconds to load**
→ Normal on Render's free tier. The server sleeps after 15 min of no traffic and takes ~30 seconds to wake up. For a paid plan ($7/month), the server stays always-on.

**MongoDB connection timeout**
→ Check that your Atlas connection string is correct, the password has no special characters that need URL-encoding, and "Allow Access from Anywhere" is enabled in Atlas Network Access.
