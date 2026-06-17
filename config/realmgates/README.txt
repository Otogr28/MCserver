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
