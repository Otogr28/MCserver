# Authoring CustomMissions — guide for Claude agents

This folder holds the **authored** primary/secondary story missions for the CustomMissions mod. One JSON
file = one mission. The files here (`primary_*`, `secondary_*`) are **placeholders** — fill them in or add
new ones. (Daily missions are AI-generated elsewhere, under `../daily/`, and are NOT authored here.)

## How to add / edit a mission (the easy path)

1. Create/edit a `*.json` file in this folder. Use a placeholder as a starting point, or the schema below.
2. Deploy it. Two options:
   - **No restart (preferred while iterating):** commit + push the MCserver repo, then
     `ssh mcserver mc-update` syncs config. Or, for a pure hot-reload of just missions:
     rsync this folder to the live server and run `ssh mcserver mc-cmd 'mission reload'`.
   - **Full pipeline:** the normal modpack deploy (`mc-ship`) also carries these files.
3. In game: `/mission reload` (op) re-reads this folder live — no restart needed. Check the result with
   `/mission list` and the **M** menu.

The loader is forgiving: unknown fields are ignored, a bad objective/reward `type` is skipped with a
warning (the rest of the mission still loads), every numeric field has a default. A file with no valid
objectives is skipped.

## Schema (summary — full spec + examples in the CustomMissions repo `DSL.md`)

```jsonc
{
  "id": "primary_03_unique_id",          // unique; how prereqs reference it
  "category": "primary|secondary",        // (daily is generated, not authored here)
  "title": "Short title",
  "description": "1-2 sentences shown on accept.",
  "lore": "optional flavor line",
  "giver": { "npcUuid": "d48a3f45-0efd-46c6-9803-5e1256d95d33", "npcName": "the-traveler" },
  "prerequisites": { "loreStage": 0, "priorMissions": ["primary_02"], "flags": [], "dimension": null },
  "objectives": [ /* see types below */ ],
  "rewards":   [ /* see types below */ ],
  "onAccept":  [ /* optional: same shape as rewards, fired on accept */ ],
  "onComplete":[ /* optional: same shape as rewards, fired on complete */ ]
}
```

**Objective types** (each also takes `description` + optional `count`, default 1):
`kill_entity`(entity|`#tag`) · `collect_item`(item) · `reach_location`(dimension,x,y,z,radius,waypoint,waypointColor) ·
`talk_to_npc`(npcUuid/npcName) · `enter_dimension`(dimension) · `advancement`(advancement) ·
`use_block`(block) · `place_block`(block) · `deliver_item_to_npc`(npcUuid/npcName,item,count) ·
`custom_signal`(signal)  ← advanced by `/mission signal <name>` (KubeJS/EasyNPC/other mods).

**Reward types:** `item`(item,count) · `xp`(amount) · `command`(command,asPlayer) · `cutscene`(script→StoryKit) ·
`unlock`(gate→Realm Gates dim) · `companion`(id→Custom Companions) · `lore_stage_advance`(to | +1 if omitted).

## Rules of thumb

- **Real ids only.** `minecraft:oak_log`, `iceandfire:fire_dragon`, `realmgates:heatdeath`, tags `#minecraft:...`.
  A bad id just makes that objective/reward skip (warned in the log). `reach_location` needs a real dimension.
- **Flugel the Traveler** (main giver): uuid `d48a3f45-0efd-46c6-9803-5e1256d95d33`, DSL `"npcName": "the-traveler"`
  (kept as the internal id; matched case/space/punctuation-insensitively, and by uuid). His in-game `CustomName`
  is now "Flugel" — prefer the **uuid** when targeting him.
- **Chain primaries** with `prerequisites.priorMissions` + `loreStage`; bump the stage with a
  `lore_stage_advance` reward on the closing mission of a chapter.
- **Waypoints:** any `reach_location` automatically shows a JourneyMap waypoint + on-screen compass for the
  player while that objective is active.
- **Story text** (titles/descriptions/lore) is fiction — use the `loremaster` agent for the prose, in
  English, Flugel the Traveler's voice, and do not use the "not X, but Y" construction. Keep early missions
  doable near the village (Aincrad / overworld, Flugel is at ~340/112/1075).
- For "talk to / interact with X" beyond plain NPC talk, prefer a `custom_signal` objective and have the
  source emit `/mission signal <name> <player>`.
