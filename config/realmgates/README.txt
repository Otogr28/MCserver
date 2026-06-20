Realm Gates config
==================
realmgates.json        global settings (policy, bootstrap, deny message, login remediation)
profiles/*.json        reusable environment/restriction presets referenced by dimensions
dimensions/*.json      per-dimension rules: travel edges, entry gate, environment, portal

Edit these and run /realmgates reload (no restart needed for rule changes).
Worldgen for custom dimensions is bundled in the mod jar and needs a server restart to change.

/realmgates regen-loot [radiusChunks]  re-rolls the loot of UNOPENED chests in loaded chunks around
you (default 4-chunk radius) so already-placed chests pick up newly-injected drops (e.g. pictos).
Already-opened chests can't be re-rolled. Stand near the chests (only loaded chunks are scanned).

Fog barriers (soft world-borders, Korok-Forest style): a vertical cylinder around an origin in
one dimension. As a player nears the edge the screen fogs over (denser the closer); reaching the
HORIZONTAL radius stops them dead just inside the edge (Y is ignored, so it can't be
climbed/dug past). Manage them in-game (ops):
  /realmgates limitfog add <name> <origin> <radius> [fogBand]   (fogBand = blocks of mist before the wall)
  /realmgates limitfog list
  /realmgates limitfog remove <name>
The wall is enforced on the CLIENT (it clamps your own position, so there's no teleport rubber-band);
the server only steps in as a far backstop. The mist shows even under Iris/Oculus shaders (it's drawn
as a HUD overlay, not just vanilla fog). The barriers themselves are saved in the world (per dimension).
The "fogBarriers" block of realmgates.json tunes the system globally (no recompile; /realmgates reload
applies it live):
  defaultFogBand        mist band used when "add" omits it (blocks)
  wallSkin              how far inside the radius the client holds you (blocks; the soft-wall skin)
  backstopMargin        blocks past the radius before the SERVER backstop teleports (client handles below this)
  pushInBlocks          how far inside the wall the backstop drops a player (rare; client wall comes first)
  messageCooldownTicks  ticks between repeats of the "turned back" line
  turnBackMessage       the action-bar line shown when turned back (§ colour codes ok)
  mistRed/Green/Blue    mist colour (0..1);  maxColorBlend  how strongly the fog tints (0..1)
  denseFarBlocks        view distance (blocks) at the wall;  fadeSpeed  how fast the mist fades in/out
The wall geometry, mist visuals and the turn-back line are all mirrored to clients, so editing them
+ /realmgates reload updates everyone live.

Bosses'Rise patch: the "bossesRise" block of realmgates.json tunes RealmGates' cross-mod fixes for the
Bosses'Rise mod (block_factorys_bosses). /realmgates reload applies it live (no recompile):
  enableHandPlacedDragonSpawner   true = the dragon boss-spawner fires by player proximity alone, so a
                                  /place'd (hand-placed) dragon tower works too, not only world-gen ones
  dragonSpawnerProximityBlocks    how close a player must be for that spawner to fire (default 8)
  dragonSpawnerExistingBossRadius box checked for an already-spawned dragon before spawning (default 16)
  dragonFullHealOnPhase2          true = Ashlord heals to full when he transforms to phase 2 (2nd bar)

Wasteland camera tilt: inside the realmgates:wasteland biome the view rolls slowly to one side, harder
the higher you climb (the corruption zone feels physically wrong with altitude). It's a real camera roll
(the horizon slants), not a screen overlay, and it's render-only (aiming/movement unaffected). The
"wastelandTilt" block of realmgates.json tunes it; the values are mirrored to clients, so editing them +
/realmgates reload updates everyone live (no recompile):
  startY          Y below which there is no lean (default 122)
  fullY           Y at which the lean maxes out; ABOVE it the lean drops back to 0 (default 260).
                  So the tilt lives in the [startY, fullY] band and goes away once you climb past fullY.
  maxTiltDegrees  worst-case roll to one side at/above fullY (default 22)
  wobbleDegrees   amplitude of the slow sway over the lean; 0 = clean steady tilt (default 3)
  wobbleSpeed     speed (radians/tick) of that sway (default 0.04)
  easeSpeed       how fast the lean fades in/out per tick (0..1; smaller = softer, default 0.05)

Custom portals: add a "portal" block to a dimension's JSON to let players light a gated
portal INTO it, e.g.:
  "portal": { "frameBlock": "minecraft:red_sandstone", "igniter": "minecraft:fire_charge", "color": "#FF3030" }
Build a rectangular frame of frameBlock (any size), right-click it with the igniter. The
portal only lights where the travel graph allows it (deny-by-default) AND any requiresToEnter
gate is satisfied; otherwise it refuses with a message. Optional "color": "#RRGGBB" tints the
lit portal (default purple). Optional "arrival": [x, y, z] sets a fixed landing spot in the
target (default: a safe surface position). The portal leads INTO the
dimension whose file it is on, so to build a return trip add a portal to the source dimension.

Deny-by-default: a transition is blocked unless it is allowed by some dimension's
canEnterFrom/canExitTo (bootstrapVanilla is OFF here, so the real overworld has no edges).

spawnDimension = realmgates:v1  -> players spawn and respawn in V1 (a plain overworld-like
dimension bundled in the jar). The real minecraft:overworld is left untouched and unreachable.

NOTE on portals: vanilla nether/End portals are hard-wired to the real overworld, so the
return trip from the nether/End would target the (unreachable) overworld. For now reach
nether/End from V1 with a command, e.g.:
  /execute in minecraft:the_nether run tp @s 0 80 0
(V1<->nether and V1<->End edges exist so these teleports are allowed and the return is too.)

The bundled example dimension realmgates:red_waste reaches from V1; test it with:
  /execute in realmgates:red_waste run tp @s 0 120 0
