// Bosses'Rise — boss-defeated hook (Option B, KubeJS).
//
// Fires when a Bosses'Rise boss TRULY dies. The mod defers the real death until its death
// animation finishes (AbstractBossEntity#shouldCancelDeath + DATA_DIE_ANIMTIME), so the normal
// server-side death event already lands at the END of the death sequence. Multi-phase bosses
// (e.g. the dragon's phase 1 -> 2) only fire ONCE here, at the final death — phase transitions are
// not deaths, so we don't need any special handling for them.
//
// This is the KubeJS flavour: a single place to react to a boss kill (loot, story beats, commands,
// StoryKit triggers, etc.). If you want OTHER Java mods to @SubscribeEvent a real Forge event,
// that's the separate "Option C" (a BossDefeatedEvent posted to the Forge bus from RealmGates).
//
// IIFE-wrapped because all KubeJS server_scripts share one global scope (see kubejs-shared-scope rule).

(function () {
    const BOSSES = {
        'block_factorys_bosses:infernal_dragon': 'Ashlord, the Infernal Dragon',
        'block_factorys_bosses:kraken': 'Nerakyss, the Kraken',
        'block_factorys_bosses:sandworm': 'Sirok, the Sandworm',
        'block_factorys_bosses:underworld_knight': 'Helvar, the Underworld Knight',
        'block_factorys_bosses:yeti': 'Skor, the Yeti',
    }

    // entity.type is exposed as a String id in this KubeJS build, but be robust either way.
    function typeId(entity) {
        const t = entity.type
        return typeof t === 'string' ? t : String(t)
    }

    EntityEvents.death(event => {
        const e = event.entity
        if (!e) return
        let level
        try { level = e.level } catch (err) { return }
        if (!level || level.isClientSide()) return

        const name = BOSSES[typeId(e)]
        if (!name) return // not a Bosses'Rise boss

        let killer = null
        try { killer = event.source ? event.source.player : null } catch (err) { /* no player */ }

        // ---- BOSS DEFEATED (end of death sequence) ----
        console.info(`[bossesrise] BOSS DEFEATED: ${name}` + (killer ? ` by ${killer.username}` : ''))

        const server = level.getServer()
        if (server) {
            // Demo reaction (edit/extend freely): a small gold action-bar line for everyone.
            server.runCommandSilent(`title @a actionbar {"text":"${name} has fallen","color":"gold"}`)
            // Add your own here, e.g.:
            //   server.runCommandSilent('story play sb:dragon_outro')      // StoryKit
            //   if (killer) server.runCommandSilent(`give ${killer.username} minecraft:diamond 3`)
        }
    })
})()
