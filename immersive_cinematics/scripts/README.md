# ImmersiveCinematics scripts

Cutscene scripts (`.json`) for the **ImmersiveCinematics** mod (`immersive_cinematics`). Each file is
one cinematic: camera keyframes (position/yaw/pitch/roll/FOV/zoom), letterbox, audio and event tracks.

## How these are made and deployed

1. **Author graphically in-game**: press **F6** to open IC's timeline editor, set an `id` in *Script Info*
   (the file is named after the `id`), build the shot, hit **Save**.
2. The save lands **directly here**: the client's scripts dir is a **symlink** to this repo folder —
   `~/.local/share/ModrinthApp/profiles/Forge 1.20.1/immersive_cinematics/scripts` → this dir. So no
   manual copy: Save in-game = file appears here. (Re-create the symlink if you reinstall the profile.)
3. **Commit + deploy**: `git add immersive_cinematics/scripts/<id>.json && git commit && git push`, then
   `ssh mcserver mc-update` rsyncs this folder to the server's `immersive_cinematics/scripts/` (so
   `/icinematics play` can read it server-side). Then `/icinematics reload` in-game (or next server start).

## Playing them

- Directly: `/icinematics play <name> [players]`
- From a **StoryKit** sequence (to layer dialogue/cards/sound on top):
  `{ "type": "cinematic", "script": "<name>" }`

> Authoring is client-side; playback is server-driven. The script JSON must exist **on the server**,
> which is why it lives in the repo and ships via `mc-update`. The schema is documented in the
> ImmersiveCinematics repo (`SCRIPT_FORMAT.md`).
