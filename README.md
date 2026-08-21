# Copy Paster

A minimal web app for syncing plain text between your personal laptop and work laptop. Paste on one device, copy on the other — no email required.

Hosted on **GitHub Pages** with **Firebase Firestore** as the database. Updates appear in real time.

**Live site:** [https://xavierzhang21.github.io/copy-paster/](https://xavierzhang21.github.io/copy-paster/)

## How it works

1. Open the site and enter the 6-digit PIN to unlock the page.
2. On your personal laptop, paste text and click **Save clip** — it goes to a shared Firebase collection.
3. Open the **same URL** on your work laptop and enter the PIN again.
4. Click **Copy** on any clip, or read the text directly.
5. Use **Delete all history** to wipe every clip from the database.

Everyone using the same GitHub Pages link sees the same clips. Bookmark that one URL on both laptops. The PIN is required once per browser tab session.

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

### 3. Deploy Firestore security rules

In the Firebase Console → **Firestore → Rules**, paste the contents of `firestore.rules` from this repo and publish.

### 4. Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. In the repo: **Settings → Pages → Source**: deploy from `main` branch, root `/`.
3. Your site will be at `https://<username>.github.io/<repo-name>/`.

## Local development

Because the app uses ES modules and Firebase CDN imports, serve it over HTTP (not `file://`):

```bash
npx serve .
```

Then open `http://localhost:3000` (or whatever port `serve` prints).

## Keyboard shortcut

**Number keys** and **Backspace** work on the passcode screen. After unlock, **Ctrl+Enter** (or **Cmd+Enter** on Mac) saves the current text in the compose box.

## Security notes

- The 6-digit PIN is a client-side page gate. It is not Firebase Authentication; anyone who inspects the page source can find it.
- All clips are stored in one shared collection. Anyone who knows the site URL (and PIN) can read or delete them.
- This is meant for non-sensitive text snippets. Do not store passwords or confidential data.

## License

MIT
