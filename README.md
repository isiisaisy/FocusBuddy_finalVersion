# React Native Starter Project (Expo) 🚀

This repository contains the starter template for the **Cross-Platform Development (CPD)** course using **React Native (Expo)**.  
The goal is to provide a working **Hello World** project that runs on an **Android emulator** with minimal setup.

---

## 🛠️ Prerequisites

Please make sure you have the following:

- 💻 **Windows 10/11 (64-bit)** or **macOS**  
- 📦 **Node.js LTS 20.x** (includes npm)  
- 📱 **Android SDK + Emulator (AVD)**  
- ⚙️ At least one configured **Android Virtual Device (AVD)**

---

## Step 1 – Install Node.js (LTS 20.x) 📦

### Option A: Using Winget (Windows, recommended) ⚡
Open **PowerShell as Administrator** and run:
```powershell
winget source update
winget install --id OpenJS.NodeJS.LTS -e

```

### Option B: macOS with Homebrew
**PowerShell als Administrator** öffnen und ausführen:
```powershell
brew install node@20
```

### Option C: Manual installation

Download the Node.js LTS 20.x installer from the official website and run it.
On Windows, ensure “Add to PATH” is checked.

---

## Verify ✅
Open a new terminal window and check:
```powershell
node -v
npm -v
```
Expected: v20.x and an npm version >= 10.

> ❗️Do not install a global expo-cli. We will use npx and project scripts instead.

---

## Step 2 – Get the project from GitHub Classroom 🎓

1. Open the **GitHub Classroom assignment link** provided by your instructor.
2. Click **“Accept assignment”**. Wait until GitHub creates your personal repository (it will be named like `cpd-<yourname>-reactnative-starter`).
3. Open your repository on GitHub and click **Code → HTTPS** (or use **GitHub Desktop**).

### Clone via Git (terminal)
```bash
# pick a folder where you keep your code, then:
git clone https://github.com/<org>/<your-repo>.git
cd <your-repo>
git branch --show-current   # expected: main
```

---

## Step 3 – Install dependencies 📥

From the project root:
```bash
npm install
# (optional CI-clean install):
# npm ci
```

---

## Step 4 – Run the app ▶️

Start the Expo Dev Server:
```bash
npm start
```

When the Expo terminal UI appears:

**Press a → open on Android emulator**
(Make sure an AVD is available; start it from Android Studio → Device Manager if needed.)

**(macOS) Press i → open on iOS Simulator**

Or run directly:
```bash
npm run android
# (macOS) npm run ios
# Optional (experimental): npm run web
```

---

## VERIFY ✅

You should see:
*The Expo Dev Server running without errors (QR code / web UI available).*

**On Android**: the app launches in the emulator and shows “Hello World 👋 – React Native Starter (Expo)”.

If it doesn’t open on Android:
- Ensure an emulator is running (Android Studio → Device Manager → start AVD).
- In the Expo UI, press a again or run:
```bash
npm run android
```

### Troubleshooting quick wins:
```bash
# Clear Metro/Expo cache and retry
npx expo start -c

# Health check
npx expo-doctor
```
