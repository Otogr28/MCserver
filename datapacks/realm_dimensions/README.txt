summerBuddies custom dimensions (editable datapack)
===================================================

This is a normal Minecraft datapack. Minecraft reads these JSON files and CREATES the dimensions
from them — no mod recompile, no code. It is SERVER-SIDE only: players receive dimension data over
the network, they do NOT need these files.

Namespace: "sb" (summerBuddies). Pick any namespace you like; dimension IDs are then "sb:<name>".

Layout
------
  pack.mcmeta                                  datapack manifest (pack_format 15 = MC 1.20.1)
  data/sb/dimension/<name>.json                REQUIRED: the dimension (its type + terrain generator)
  data/sb/dimension_type/<name>.json           optional: only if the dimension uses a custom type
  data/sb/worldgen/biome/<name>.json           optional: only if it uses a custom biome
  data/sb/forge/biome_modifier/<name>.json     optional: mob spawns for a custom biome

Add a NEW dimension
-------------------
Simplest (reuses vanilla overworld type + biomes) — ONE file is enough. See
  data/sb/dimension/example_overworld.json
Copy it to data/sb/dimension/<your_name>.json and you have a new dimension "sb:<your_name>".

Themed (custom terrain) — clone the 4-file pattern. The bundled realmgates dimension "red_waste" is a
worked example; its JSON lives in the realmgates repo under
  src/generated/resources/data/realmgates/{dimension,dimension_type,worldgen/biome,forge/biome_modifier}/red_waste.json
Copy those into this datapack under your namespace, rename the IDs, and tweak.

Make it reachable + give it a portal (realmgates)
-------------------------------------------------
A new dimension is UNREACHABLE under deny-by-default until realmgates has a rule for it. Add
  config/realmgates/dimensions/<your_name>.json   (on the server) e.g.:
    {
      "dimension": "sb:your_name",
      "canEnterFrom": ["realmgates:v1"],
      "canExitTo": ["realmgates:v1"],
      "portal": { "frameBlock": "minecraft:gold_block", "igniter": "minecraft:fire_charge", "color": "#2BE04A" }
    }
Then in-game: /realmgates reload (rules hot-reload; the new dimension still needs a server restart the
first time it is created). Build the gold-block frame, light it with a fire charge -> portal opens (only
if the travel graph + any requiresToEnter gate allow it).

Deploy + enable
---------------
- mc-update rsyncs this datapack to the server world and chowns it (see howtoadddimensions.md).
- First time only, enable it: mc-cmd "datapack enable \"file/realm_dimensions\"" then restart.
- Dimensions persist: region data lives in world/dimensions/sb/<name>/ and survives independently;
  keep this datapack present (it is versioned in git + redeployed by mc-update) so they never unload.
