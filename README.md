# Copy Paster

A minimal web app for syncing plain text between your personal laptop and work laptop. Paste on one device, copy on the other — no email required.

Hosted on **GitHub Pages** with **Firebase Firestore** as the database. Updates appear in real time.

## How it works

1. Open the site on your personal laptop and paste text.
2. Click **Save clip** — it goes to Firebase under your private room.
3. Open the **same bookmarked link** on your work laptop.
4. Click **Copy** on any clip, or read the text directly.
5. Use **Delete all history** to wipe every clip from the database.

Each browser session gets a unique room URL (e.g. `?room=abc123…`). Bookmark that URL on both machines. Anyone with the link can access that room, so treat it like a password.

## Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** (start in production mode).
3. Under **Project settings → Your apps**, add a **Web** app and copy the config object.

### 2. Configure the app

```bash
cp js/firebase-config.example.js js/firebase-config.js
```

Edit `js/firebase-config.js` and paste your Firebase credentials.

> `firebase-config.js` is gitignored so your keys are not committed. For GitHub Pages you will add these values in the deployed copy (see deploy step below).

### 3. Deploy Firestore security rules

In the Firebase Console → **Firestore → Rules**, paste the contents of `firestore.rules` from this repo and publish.

### 4. Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `copy-paster`).
2. Push this project to the repo.
3. Copy `js/firebase-config.example.js` to `js/firebase-config.js` locally, fill in credentials, and commit **only** `firebase-config.js` if you are comfortable (Firebase web API keys are designed to be public; security comes from Firestore rules + private room URLs). Alternatively, add the file only on the `gh-pages` branch or use GitHub Actions secrets.
4. In the repo: **Settings → Pages → Source**: deploy from `main` branch, root `/`.
5. Your site will be at `https://<username>.github.io/copy-paster/`.

**Important:** After the first deploy, open the site, copy your room link, and bookmark it on both laptops.

## Local development

Because the app uses ES modules and Firebase CDN imports, serve it over HTTP (not `file://`):

```bash
npx serve .
```

Then open `http://localhost:3000` (or whatever port `serve` prints).

## Keyboard shortcut

**Ctrl+Enter** (or **Cmd+Enter** on Mac) saves the current text in the compose box.

## Security notes

- Room IDs are 32-character random hex strings — hard to guess, but not impossible.
- Do not share your room URL publicly.
- Firestore rules allow read/write only when `roomId` is at least 16 characters.
- This is meant for non-sensitive text snippets. Do not store passwords or confidential data.

## License

MIT
