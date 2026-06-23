# Realm Gates Installer

A small cross-platform desktop app (Java 17 + Swing) that installs and updates the
**Realm Gates / summerBuddies** modpack. It replaces the old PowerShell scripts and works
on Windows, macOS and Linux. It is **not** a game launcher — you still play from the
official Minecraft launcher or SKlauncher.

## What it does

**Install**
1. Clones the modpack repo (`Otogr28/MCserver`) into a folder you pick (that folder becomes the game directory).
2. Installs **Forge 1.20.1-47.4.0** headlessly (via the official Forge installer, run through the app's bundled Java — no system Java needed).
3. Adds a **"Realm Gates"** profile to `.minecraft/launcher_profiles.json` (shows up in both the official launcher and SKlauncher).
4. Detects your hardware (GPU/VRAM/RAM/CPU via oshi) and sets shaders accordingly in `config/oculus.properties`:
   - **HIGH** → Solas Shader on · **MEDIUM** → Complementary on · **LOW/OFF** → shaders off.
   - `-Xmx` is sized from your RAM. Override the tier with the **Shaders** dropdown (Auto/Off/Low/Medium/High).
5. Unbinds CMDCam's cinematic-camera keys (Roll = G/H/J, Zoom = V/B/N, Add Point = P, Start/Stop = U, Clear = Delete) in `options.txt` so they don't fire by accident.

**Sync / Update** — selective and non-destructive. Only `mods/`, `kubejs/` and `config/fancymenu/`
are forced to match the server (with upstream deletions pruned). Everything else is left as-is —
your `config/oculus.properties` (shader tier), `*-client.*` settings, `options.txt`, worlds and logs.

**Unbind camera keys** — runs just step 5 above, for an existing install.

## Build

```bash
cd launcher
./gradlew shadowJar     # fat jar -> build/libs/realmgates-installer.jar (needs Java to run)
./gradlew jpackage      # native bundle for the current OS -> build/jpackage/
```

Native installers for all three OSes are built by CI (`.github/workflows/launcher-release.yml`):
push a tag `installer-v<version>` (e.g. `installer-v1.0.0`) and the matrix produces
`.exe`/`.msi` (Windows), `.dmg` (macOS), `.deb` + a portable `.tar.gz` (Linux), attached to a GitHub Release.

> Optional: drop icons at `jpackage/RealmGates.{ico,icns,png}` — the build uses them if present.

## Layout

```
core/      Platform paths, app state, build info, progress, orchestrator
install/   Downloader, RepoCloner (JGit), ForgeInstaller, LauncherProfiles, OptionsPatcher (keybinds)
sync/      SyncEngine (path-scoped tree materialise + prune)
hardware/  HardwareProbe (oshi), TierClassifier, OculusConfig (shader tier -> oculus.properties)
ui/        InstallerFrame (Swing), LogPanel
```
