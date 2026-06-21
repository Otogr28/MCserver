# ImmersiveCinematics scripts

Cutscene scripts (`.json`) for the **ImmersiveCinematics** mod (`immersive_cinematics`). Each file is
one cinematic: camera keyframes (position/yaw/pitch/roll/FOV/zoom), letterbox, audio and event tracks.

## How these are made and deployed

1. **Author graphically in-game**: press **F6** to open IC's timeline editor, build the shot, save it.
   IC writes the file to your client's `.minecraft/immersive_cinematics/scripts/<name>.json`.
2. **Copy that `<name>.json` into this folder** (`MCserver/immersive_cinematics/scripts/`).
3. **Deploy**: `ssh mcserver mc-update` rsyncs this folder to the server's
   `immersive_cinematics/scripts/` (so `/icinematics play` can read it server-side). Then run
   `/icinematics reload` in-game (or it loads on the next server start).

## Playing them

- Directly: `/icinematics play <name> [players]`
- From a **StoryKit** sequence (to layer dialogue/cards/sound on top):
  `{ "type": "cinematic", "script": "<name>" }`

> Authoring is client-side; playback is server-driven. The script JSON must exist **on the server**,
> which is why it lives in the repo and ships via `mc-update`. The schema is documented in the
> ImmersiveCinematics repo (`SCRIPT_FORMAT.md`).
