# SpendMat — Daily Spending Desk

**SpendMat** is a local-first, offline daily spending tracker styled like a tactile cutting-mat and torn-notebook desk. Built with **Electron** for Windows desktop—with a native **Android** companion wrapper—SpendMat helps you log everyday expenses in seconds and automatically notifies you at night if you forgot to record the day.

---

## Features

- **Today's Sheet (Quick Expense Ledger)** — Log amounts, notes, and categories (`Food & Drink`, `Transport`, `Groceries`, `Bills & Utilities`, `Shopping`, `Health`, `Entertainment`, `Other`) with `Ctrl+N` quick add, inline editing, and undo support.
- **$0 No-Spend Day Stamp** — Didn't spend anything today? Stamp the day as `$0` so your streak stays accurate and tonight's reminder skips you.
- **Automatic Night Watch** — Checks automatically at your chosen time (default `21:00`). If you haven't logged an expense or stamped a `$0` day, SpendMat sends a native notification with options to log spending, stamp `$0`, or snooze for 30 minutes (plus optional 30-minute or 60-minute repeats).
- **System Tray & Launch at Login (Windows)** — Closing the window keeps SpendMat watching quietly in your taskbar tray so nightly alerts still fire.
- **7-Day Chart & Monthly Archive** — Inspect the last 7 days at a glance, browse a monthly status calendar (logged, `$0` stamped, or unlogged past days), view a monthly category breakdown, and search/filter all entries.
- **Multi-Currency & Optional Daily Budget** — Supports `USD`, `IDR`, `EUR`, `GBP`, `JPY`, `SGD`, and `MYR`, with an optional daily spending target bar.
- **Day & Night Desk Themes** — Switch between the bright cobalt Day Desk and a dark navy Night Desk for late-night logging.
- **100% Local & Portable** — All fonts and assets are bundled offline. Data is saved locally as JSON, with one-click **CSV export** and **JSON backup/import**.

---

## Tech Stack

- **Desktop App:** Electron (`^35.0.0`), Vanilla HTML/CSS/JavaScript, Node.js
- **Bundled Fonts:** `@fontsource/silkscreen`, `@fontsource/plus-jakarta-sans`, `@fontsource/ibm-plex-mono`
- **Desktop Packaging:** `electron-builder` (Windows NSIS x64 installer)
- **Android Companion:** Native Android WebView + background `AlarmManager` / `BroadcastReceiver` (Java 17, `minSdk 24`, `targetSdk 36`)
- **Tests:** Built-in Node.js test runner (`node:test`)

---

## Project Structure

```text
.
├── assets/                  # App and system tray icons
├── src/
│   ├── main/
│   │   ├── main.js          # Electron window, tray, IPC handlers, desktop notifications
│   │   ├── scheduler.js     # NightReminderScheduler logic
│   │   └── store.js         # Local JSON persistence, CSV export, backup/import
│   ├── preload/
│   │   └── preload.js       # Context-isolated IPC bridge
│   └── renderer/
│       ├── index.html       # Desk, Monthly Archive, and Night Watch views
│       ├── js/              # UI logic, platform bridge, formatting, SVG icons
│       └── styles/          # Day & Night Desk stylesheets
├── android/                 # Android wrapper project (WebView + native night alarm)
├── scripts/
│   └── build-android.js     # Syncs web assets & offline fonts and builds debug APK
├── tests/
│   └── core.test.js         # Unit tests for SpendingStore and NightReminderScheduler
├── DESIGN.md                # Visual system, color palette, and typography guide
└── package.json
```

---

## Installation & Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/)** v18 or newer (includes `npm`)
- **Git**

*(Optional — only needed if building the Android APK)*:
- **JDK 17 or JDK 21** (`JAVA_HOME` configured)
- **Android SDK** (`ANDROID_HOME` configured) and **Gradle 8.13+**

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/PDPyeh/SpendMat-DailySpendingChecker.git
   cd SpendMat-DailySpendingChecker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the desktop app**
   ```bash
   npm start
   ```

4. **Run the test suite**
   ```bash
   npm test
   ```

---

## Building for Production

### Windows Installer (`.exe`)

Package a standalone Windows NSIS installer using `electron-builder`:

```bash
npm run build:win
```

The installer and unpacked build will be created in `dist/` (for example, `dist/SpendMat Setup 1.0.0.exe`).

### Android APK (`.apk`)

Sync the shared UI assets and offline fonts into the Android project and build the debug APK:

```bash
npm run build:android
```

The compiled APK will be copied to `dist/SpendMat-android.apk` (requires Android 7.0 / API 24 or higher).

---

## Data Storage

- **Windows:** Saved locally in Electron's user data directory (`%APPDATA%\spendmat-daily-spending\spendmat-data\spending-data.json`). You can open the folder directly from **Night Watch → Open Data Folder**.
- **Backups & Exports:** Use **Export CSV** in the Monthly Archive or **Export / Import JSON Backup** in Night Watch Settings to move data between devices.

---

## Contributing

Contributions are welcome! Whether it's a bug fix, accessibility improvement, new currency preset, or Android parity update, follow these steps:

1. **Fork the repository** on GitHub.
2. **Clone your fork** and create a new branch from `main`:
   ```bash
   git clone https://github.com/<your-username>/SpendMat-DailySpendingChecker.git
   cd SpendMat-DailySpendingChecker
   git checkout -b feat/your-feature-name
   ```
3. **Install dependencies** and verify everything runs:
   ```bash
   npm install
   npm test
   ```
4. **Make your changes** following these project guidelines:
   - Read [DESIGN.md](./DESIGN.md) before modifying UI styles so new components match the cutting-mat palette, typography, and contrast standards.
   - Keep `src/main/store.js` and `src/main/scheduler.js` free of Electron UI dependencies so they remain unit-testable with `node --test`.
   - If you change anything in `src/renderer/` or `src/renderer/js/bridge.js`, check whether the Android bridge (`android/app/src/main/java/com/spendmat/daily/`) also needs an update.
   - Add or update unit tests in `tests/core.test.js` for storage, export, or reminder logic changes.
5. **Test locally**:
   ```bash
   npm test
   npm start
   ```
6. **Commit and push** your branch:
   ```bash
   git add .
   git commit -m "feat: describe your change clearly"
   git push origin feat/your-feature-name
   ```
7. **Open a Pull Request** against `main` describing what changed, why, and how you tested it. Include screenshots for UI changes.

### Reporting Issues

Found a bug or have a feature request? Open an issue on [GitHub Issues](https://github.com/PDPyeh/SpendMat-DailySpendingChecker/issues) with:
- Your OS / platform (Windows version or Android version)
- Steps to reproduce the issue
- Expected vs. actual behavior

---

## License

This project is licensed under the **MIT License**. See [package.json](./package.json) for details.
