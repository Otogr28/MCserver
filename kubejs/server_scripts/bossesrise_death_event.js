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

    // The two "Sacred Beasts" whose deaths drive the StoryKit cutscene -> scoreboard fake-player key.
    // Scoreboard-backed (not in-memory) so the milestone survives a server restart BETWEEN the two
    // kills: kill one, restart, kill the other -> still resolves to the "both perished" scene.
    const SACRED = {
        'block_factorys_bosses:yeti': '#yeti',
        'block_factorys_bosses:kraken': '#kraken',
    }

    // KubeJS server wrapper (has scheduleInTicks; the vanilla MinecraftServer does not). Captured on
    // load; we also (re)create the tracking objective every load — runCommandSilent swallows the
    // harmless "objective already exists" message, so this is a quiet no-op once it exists.
    let KSERVER = null
    ServerEvents.loaded(ev => {
        KSERVER = ev.server
        ev.server.runCommandSilent('scoreboard objectives add sb_sacred_beasts dummy')
    })

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

            // CustomMissions — GLOBAL completion of the "Sacred Beast" primaries: the kill counts for the whole
            // group. `mission signal <name> 1 @a` advances that custom_signal objective for EVERY online player
            // who has it active, not only the one who landed the blow (so one kill completes it for everyone).
            const MISSION_SIGNAL = {
                'block_factorys_bosses:yeti': 'defeat_yeti',
                'block_factorys_bosses:kraken': 'defeat_kraken',
            }
            const signal = MISSION_SIGNAL[typeId(e)]
            if (signal) {
                server.runCommandSilent(`mission signal ${signal} 1 @a`)
            }

            // ---- Sacred Beast cutscene (StoryKit) ----
            // Mark this beast down, then count how many of the two are dead. First kill -> "one
            // fallen, one remains"; second kill -> "both perished, bring to the altar". Played for
            // @a (the kill counts for the whole group, like the mission signal above). The cutscene
            // has NO camera: just the letterbox bars + the HUD auto-hide StoryKit applies while any
            // sequence runs, the shrine-revelation sting, and two lines timed to its two db swells.
            // `scoreboard players get` returns the score (1) when set, or 0 when never set (the silent
            // failure), so each beast reads as 1 (down) or 0 (alive). Since we set THIS beast first,
            // `down` is 1 or 2.
            const beast = SACRED[typeId(e)]
            if (beast) {
                server.runCommandSilent(`scoreboard players set ${beast} sb_sacred_beasts 1`)
                const y = server.runCommandSilent('scoreboard players get #yeti sb_sacred_beasts')
                const k = server.runCommandSilent('scoreboard players get #kraken sb_sacred_beasts')
                const down = (y === 1 ? 1 : 0) + (k === 1 ? 1 : 0)
                const seq = down >= 2 ? 'beasts_both_slain' : 'beast_first_slain'
                // The boss has its OWN death cinematic — wait 8s (160 ticks) so that one finishes
                // before our StoryKit cutscene rolls (no overlap).
                const roll = () => server.runCommandSilent(`story play ${seq} @a`)
                if (KSERVER) KSERVER.scheduleInTicks(160, () => roll())
                else roll()
            }
        }
    })
})()
