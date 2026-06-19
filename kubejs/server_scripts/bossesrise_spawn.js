// Bosses'Rise (block_factorys_bosses) — on-demand structure spawner.
//
// Natural world generation of the five Bosses'Rise structures is DISABLED by the empty
// structure_set overrides in kubejs/data/block_factorys_bosses/worldgen/structure_set/*.json.
// This script gives an admin command to drop any of those structures on demand, WITH all of its
// internal logic intact: the encounter lives entirely in placed block entities (BossSpawnerBlock /
// KrakenSpawnerBlock summon the boss on proximity, HugeDoorBlock is the key-gated arena door, and
// the chests carry their loot tables) — so `/place structure` reproduces a fully working boss
// arena exactly as natural worldgen would have.
//
// Usage (needs OP / permission level 2):  /bossrise place <dragon|kraken|sandworm|knight|yeti>
// The structure is placed at the command runner's position, in their current dimension.
//
// ── Notes / gotchas baked into this script ──
//   1. Every server_script shares ONE scope in KubeJS, so this whole file is wrapped in an IIFE to
//      avoid `const` collisions with the other scripts (e.g. the $EntityType clash that silently
//      killed heatdeath_dragons.js before it was wrapped).
//   2. `server.runCommandSilent(...)` runs at the OVERWORLD spawn as the server — it would place the
//      structure in the wrong dimension. We run the sub-commands through the dispatcher with the
//      command runner's OWN source (`performPrefixedCommand(ctx.source, ...)`) so position AND
//      dimension are correct (this matters for the Nether-only Underworld Arena).
//   3. `/place structure` only fills already-loaded chunks. We `forceload add` a box around the spot,
//      wait a few ticks for those chunks to pin, THEN place, then release the forceload (the placed
//      blocks are already written to the region, so dropping the forceload never deletes them).
//      The box is ±112 blocks → at most 225 chunks, under vanilla's 256-chunk forceload limit.

(function () {
    const NS = 'block_factorys_bosses'

    // friendly subcommand -> structure id
    const STRUCTS = {
        dragon: 'dragon_tower',       // Ashlord, the Infernal Dragon  (surface; many biomes)
        kraken: 'kraken_ship',        // Nerakyss, the Kraken          (deep ocean; floats)
        sandworm: 'sandworm_nest',    // Sirok, the Sandworm           (desert)
        knight: 'underworld_arena',   // Helvar, the Underworld Knight (UNDERGROUND, meant for Nether)
        yeti: 'yeti_hideout',         // Skor, the Yeti                (surface; snowy)
    }

    const RADIUS = 112        // forceload half-size in blocks (keeps the region < 256 chunks)
    const LOAD_DELAY = 5      // ticks to let the forceloaded chunks pin before placing
    const RELEASE_DELAY = 100 // ticks (~5s) to keep the forceload after placing, then release

    // KubeJS server wrapper (has scheduleInTicks); the vanilla MinecraftServer does not.
    let KSERVER = null
    ServerEvents.loaded(e => { KSERVER = e.server })

    function later(ticks, fn) {
        if (KSERVER) KSERVER.scheduleInTicks(ticks, () => fn())
        else fn() // fallback: run inline if the wrapper isn't available yet
    }

    function placeStructure(ctx, key) {
        const src = ctx.source
        const dispatcher = src.getServer().getCommands()
        const pos = src.getPosition() // Vec3 at the runner, in the runner's dimension
        const x = Math.floor(pos.x), y = Math.floor(pos.y), z = Math.floor(pos.z)
        const x1 = x - RADIUS, z1 = z - RADIUS, x2 = x + RADIUS, z2 = z + RADIUS
        const id = `${NS}:${STRUCTS[key]}`

        dispatcher.performPrefixedCommand(src, `forceload add ${x1} ${z1} ${x2} ${z2}`)

        later(LOAD_DELAY, () => {
            dispatcher.performPrefixedCommand(src, `place structure ${id} ${x} ${y} ${z}`)
            dispatcher.performPrefixedCommand(src,
                `tellraw @s {"text":"[Bosses'Rise] Placed ${id} @ ${x} ${y} ${z}. Walk in to trigger the boss.","color":"gold"}`)
            later(RELEASE_DELAY, () => {
                dispatcher.performPrefixedCommand(src, `forceload remove ${x1} ${z1} ${x2} ${z2}`)
            })
        })
        return 1
    }

    ServerEvents.commandRegistry(event => {
        const Commands = event.commands
        const placeNode = Commands.literal('place')
        Object.keys(STRUCTS).forEach(key => {
            placeNode.then(Commands.literal(key).executes(ctx => placeStructure(ctx, key)))
        })
        event.register(
            Commands.literal('bossrise')
                .requires(s => s.hasPermission(2))
                .then(placeNode)
        )
    })
})()
