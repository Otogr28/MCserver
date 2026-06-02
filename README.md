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

### Option A — Download as a ZIP (easiest, no tools)
1. On this GitHub page, click the green **`<> Code`** button → **Download ZIP**.
2. Unzip it.
3. Copy the **`mods`** and **`config`** folders into your Forge 1.20.1 instance
   (the folder that already has a `mods` and `config` folder).
4. When something changes, download the ZIP again and re-copy.

### Option B — Git for Windows (graphical interface)
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

---

## 🛠️ For the admin

- Source of truth: the admin PC (`~/MCserver`).
- `git push` → GitHub → the server runs `git pull` and restarts (`mc-update`).
- The translation backend (speech-to-text + DeepL) runs as a separate service on the VPS;
  no API keys live in this repo or in the mod.
