shrine_revelation.ogg  —  Sacred Beast "revelation" cinematic sting

Source: cut 0:00-0:11 of https://youtu.be/pNI92nfAiqI (the Zelda BotW shrine-monk "revelation"
sound). Stereo on purpose -> Minecraft plays stereo sounds NON-positionally (2D, both ears, full
volume regardless of where you stand), which is what we want for a cinematic sting.

Registered in sounds.json as the sound event  summerbuddies:shrine_revelation  (category "master",
stream:false). Played by the StoryKit sequences config/storykit/sequences/beast_first_slain.json and
beasts_both_slain.json (via the `sound` action -> /playsound summerbuddies:shrine_revelation master).

The clip has TWO db swells: swell 1 peaks ~2.5s, a near-silent valley ~5.5-6.0s, swell 2 peaks
~7.5-8.5s, fades out by ~11s. The two cutscene lines are timed to land on those two swells.

This file IS versioned (the default `*.ogg` ignore in .gitignore has an explicit `!` exception for it)
so it reaches players via git pull / the installer. The server does NOT need it; only clients play it.
