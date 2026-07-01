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

Wildcard (realmgates:wildcard): a single-use gamble token. Right-click it for a chance to turn into a
random item from the WHOLE item registry (vanilla + every loaded mod); on a miss it just crumbles away.
The "wildcard" block of realmgates.json tunes it; /realmgates reload applies it live (no recompile):
  winChance          probability (0..1) a use yields a prize, else the token is destroyed (default 0.20)
  rewardCount        how many copies of the rolled item to give on a win (default 1)
  cooldownTicks      post-use cooldown so a double-click can't drain a stack (default 8; 0 = none)
  excludeNamespaces  item namespaces removed from the prize pool (default ["born_in_chaos_v1"]); minecraft:air
                     is always excluded. Add more ids here to keep other mods' items out of the pool.

Player land claims (/claim): any player can claim land that only they (plus anyone they trust, and ops)
may build in -- the player-facing twin of the op /realmgates protect zones. /claim add <from> <to> [name]
(full height, current dimension) | list | here | remove <name>. You can let teammates or housemates build
in your claim too: /claim trust <claim> <player> | untrust <claim> <player> | trusted <claim>. The trusted
player need not be online (resolved via online -> profile cache -> offline UUID, so case matters for a name
never seen before). The "claims" block of realmgates.json tunes it; /realmgates reload applies it live (no
recompile):
  maxClaims        max claims one player may own at once (default 3)
  maxSide          max side length in blocks on either horizontal axis -- a footprint up to maxSide x maxSide
                   (default 200). Claims may not overlap each other or an op protected zone.
  blockExplosions  true = explosions (creeper/TNT) can't destroy claimed blocks (default true)
  denyMessage      action-bar shown to someone who can't build here; %owner% -> the owner's name
                   (default "Claimed by %owner%."). Only the owner + trusted players + ops can break/place
                   inside a claim; mob spawning and non-player machinery (pistons/dispensers/farms) are left alone.
  maxTrusted       max trusted players the owner may add to a single claim (default 10)

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

------------------------------------------------------------------------------
ARENA / THE TRIAL  ("arena" block in realmgates.json)
------------------------------------------------------------------------------
The op command /realmgates arena enter|leave drops a player into a freshly
instanced flat-white boss arena (foundation of THE TRIAL). The instance is
EPHEMERAL: its on-disk files are wiped each time it is (re)created, so a run
never inherits a previous run's boss/mobs. Tunables (hot-reloadable with
/realmgates reload):

  bossId             entity id of the boss to face (default
                     "block_factorys_bosses:yeti").
  spawnDistanceMin   / spawnDistanceMax  how far (blocks) from the player the
                     boss is placed (default 12 / 16).
  spawnAttempts      placement retries before giving up (the boss is large).
  leaveGraceTicks    / emptyGraceTicks / victoryGraceTicks  how long (ticks)
                     the instance lingers before it fades after a leave/fail,
                     after it empties, and after a win (default 40 / 200 / 100).
  spawnBossActive    true (default): spawn the boss already awake & fightable.
                     Bosses'Rise bosses spawned "frozen" (STRUCTURE) wait for a
                     player to break their structure's ice to wake — which this
                     empty arena has none of, so true is required here. Set
                     false only for a boss whose awaken trigger exists in-world.
  sealLoadout        true (default): THE TRIAL loadout vault — strip the player
                     bare on entry and return everything intact on every exit
                     (leave / death / disconnect / crash). false = keep your
                     gear inside (pure boss-arena test).
  sealCompanions     true (default): also disable the player's CustomCompanions
                     companion for the run. Only applies when sealLoadout is on.

"trial" block in realmgates.json  (THE TRIAL wave gauntlet, Phase 2):
  enabled            false (default): /realmgates arena enter is the single-boss
                     arena. true: it becomes a wave run.
  waveMobs           entity ids the waves draw from at random
                     (default zombie / skeleton / spider).
  wavesPerTier       waves per tier (default 3).
  baseMobsPerWave    mobs in a tier's first wave (default 4).
  mobGrowthPerWave   extra mobs each later wave (default 2 -> 4, 6, 8...).
  tierBosses         boss id per tier (list length = number of tiers). Clearing
                     a tier's waves spawns its boss; killing it advances; the
                     last tier's boss ends the run (win -> auto-return).
                     Default: one tier ending in the yeti.
  pickTimeoutTicks   how long a between-wave upgrade offer waits before auto-
                     picking one (default 300 = 15s).
  upgrades           the "choose 1 of 3" run-upgrade pool. Each entry:
                       { "id", "name", "description",
                         "attribute": "minecraft:generic.attack_damage",
                         "amount": 2.0 }
                     Between waves the player is offered 3 at random and clicks
                     one (chat); it stacks that attribute bonus for the run and
                     is stripped on exit. Default pool: Vigor / Might /
                     Swiftness / Guard / Ferocity.
