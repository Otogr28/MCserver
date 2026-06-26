beast_roar.ogg  —  Sacred Beast roar (yeti Skor / kraken Nerakyss)

Drop the roar clip here as:   beast_roar.ogg   (this exact name, .ogg/Vorbis, mono recommended)

Registered in sounds.json as the sound event  summerbuddies:beast_roar  (category "hostile").
Played by kubejs/server_scripts/bossesrise_beast_roar.js when the boss does its companion-wiping roar.

Notes:
- A short one-shot is best (stream:false). Keep it under ~5s.
- The server does NOT need this file; only players' clients play it (it rides the kubejs/ sync).
  Until the .ogg is here, the attack still kills companions — just with no audio.
- Loudness/pitch are set in the script (VOLUME 8, PITCH 0.7); tune there if needed.
