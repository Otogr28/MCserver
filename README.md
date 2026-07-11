# summerBuddies — Modpack (Forge 1.20.1)

This repository distributes the **mods** and **configs** for the **summerBuddies** Minecraft server.
The world, logs and server files are **not** here (they change constantly).

> You need **Minecraft Forge 1.20.1** installed in your launcher.

---

## 🎮 For players

### What you need
1. **Minecraft Java Edition** + a launcher with **Forge 1.20.1** installed.
2. The mods and configs from this repo, copied into your Forge instance.
3. The server address — **ask the admin** for it.

### Option A (recommended) — Realm Gates Installer (Windows / macOS / Linux)
A small app that does **everything**: installs **Forge 1.20.1** for you, downloads the modpack,
adds a **"Realm Gates"** profile to your launcher (shows up in the **official Minecraft launcher**
*and* **SKlauncher**), and picks shaders to match your computer. No Git, no PowerShell, **no Java
needed** — the app bundles its own.

1. Download the installer for your system from the
   [**Releases page**](https://github.com/Otogr28/MCserver/releases):
   - **Windows:** `.exe` (or `.msi`). If SmartScreen warns, click *More info → Run anyway*.
   - **macOS:** `.dmg`. First open: right-click the app → *Open* → *Open anyway* (it's unsigned).
   - **Linux:** `.deb` (Debian/Ubuntu) or the portable `*-linux-portable-*.tar.gz` (any distro).
2. Open it and click **Install** (pick a folder, e.g. `~/RealmGates`).
3. Launch Minecraft from your launcher → choose the **Realm Gates** profile → play.

When the admin says there's an update, open the app and click **Sync / Update**. It only refreshes
the shared modpack files and **keeps your personal settings** (shaders, keybinds, language, mic, world).

> Shaders are set automatically from your hardware (strong PC → Solas on; weaker PC → off). Change it
> any time with the **Shaders** dropdown, or in-game via **Options → Video Settings → Shaders**.

### Option A2 — One PowerShell script (Windows only, legacy)
A single command installs Git (if needed) and downloads the modpack into a folder. You then point
your launcher's Forge 1.20.1 instance **at that folder** and launch from there. Open **PowerShell**
and paste:

```powershell
iwr -useb https://raw.githubusercontent.com/Otogr28/MCserver/master/install.ps1 | iex
```

This creates the modpack folder (default `C:\Users\YOU\summerBuddies`). In your launcher
(Prism/CurseForge/Forge), set that folder as your instance's game directory and play.

To update whenever the admin says there's a new version, just **double-click `sync.bat`** in that
folder. It force-updates everything to match the server. That's it.

> ⚠️ Updating resets the shared modpack files to the server's version, so don't hand-edit files in
> this folder. **Your own settings are kept**: world/saves, screenshots, `options.txt`
> (keybinds/video), and per-player `*-client` configs — including your **language** (voicetrans) and
> **microphone / push-to-talk** (Simple Voice Chat) — survive every update.

### Option B — Download as a ZIP (easiest, no tools)
1. On this GitHub page, click the green **`<> Code`** button → **Download ZIP**.
2. Unzip it.
3. Copy the **`mods`** and **`config`** folders into your Forge 1.20.1 instance
   (the folder that already has a `mods` and `config` folder).
4. When something changes, download the ZIP again and re-copy.

### Option C — Git for Windows (graphical interface)
This keeps the modpack updated with a couple of clicks instead of re-downloading every time.

**Install Git for Windows**
1. Download it from **https://gitforwindows.org** and run the installer.
2. Accept all the defaults (just keep clicking **Next** → **Install**).
   This adds **Git GUI** and **Git Bash** to your computer.

**Clone the modpack (first time only)**
1. Open the **Start menu** and launch **Git GUI**.
2. Click **Clone Existing Repository**.
3. Fill in the two fields:
   - **Source Location:** `https://github.com/Otogr28/MCserver.git`
   - **Target Directory:** an empty folder you choose, e.g. `C:\Users\YOU\summerBuddies`
     *(the folder must NOT exist yet — Git creates it).*
4. Click **Clone** and wait for it to finish.

**Copy the mods into your game**
- Open the folder you just cloned and copy the **`mods`** and **`config`** folders into your
  Forge 1.20.1 instance.
- 💡 Tip: some launchers let you point the instance directly at this folder, so you never copy
  again. If unsure, just copy the two folders.

**Update later (when a mod or config changes)**
1. Open **Git GUI** → **Open Existing Repository** and pick your cloned folder
   (next time it shows up under **Recent Repositories**).
2. Menu **Remote → Fetch from → origin**.
3. Menu **Merge → Local Merge…** → choose **origin/master** → **Merge**.
4. Re-copy the **`mods`** and **`config`** folders into your instance.

> Prefer typing a command? Open the cloned folder, right-click → **Git Bash Here**, and run
> `git pull`. That does the fetch + merge in one step.

---

## 🗣️ Voice & chat translation (the `voicetrans` mod)

This server runs **voicetrans**, a real-time translator (QSMP-style): it shows **floating subtitles
above a speaker's head** plus a **chat-style transcript**, each translated into **your** chosen
language, and it also translates **text chat**.

**You don't need any API key** — all the translation happens on the server. You only need:
1. The **`voicetrans`** mod (already in this repo's `mods/`).
2. **Simple Voice Chat** (also in `mods/`) — required; this is what carries the voice.

**Set your languages in-game**
- Main menu or pause → **Mods → Voice Translate → Config**, or bind a key in
  **Options → Controls → "Voice Translate: Open settings"**.
- **Language you speak** — e.g. `en`, `es`, `fr`. Lets the server skip translation (and save cost)
  when nobody nearby needs another language.
- **Language to read** — what you want subtitles and chat translated *into*.

**Set up your microphone** in Simple Voice Chat (press the SVC settings key, default **`V`**):
pick your mic and a push-to-talk key.

> Heads-up: if everyone nearby already speaks your language, nothing is translated — that's on
> purpose, to save resources. Translation kicks in when someone nearby uses a different language.


