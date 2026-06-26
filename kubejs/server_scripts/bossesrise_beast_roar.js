// Bosses'Rise — Sacred Beast "roar" attack: a periodic AoE that INSTANTLY kills every companion near
// the boss while it is being fought. No animation; just a beast-roar sound + the wipe.
//
//   * Affects only block_factorys_bosses:yeti (Skor) and block_factorys_bosses:kraken (Nerakyss).
//   * While a player is within HEAR_RADIUS of the boss (i.e. the encounter is live), every COOLDOWN_TICKS
//     the boss roars: it plays summerbuddies:beast_roar to nearby players and `/kill`s every
//     customcompanions:companion / companion_warrior within ROAR_RADIUS. /kill = genericKill, which
//     bypasses invulnerability, so it is a GUARANTEED insta-death (what "insta" asked for) — at the cost
//     of an attacker on the death message (a roar + sudden death conveys it; switch to /damage ... by @s
//     if you ever want "slain by Skor" attribution, but that one respects resistances and may not 1-shot).
//
// WHY KubeJS and not a mixin: Bosses'Rise is a third-party jar (no in-house source to weave), and the
// player installer only syncs mods/ + kubejs/ + fancymenu/. A server_script applies the kill server-side
// AND the sound asset rides the same kubejs/ sync to every client — a mixin would need its own jar and a
// client-side companion sound anyway. This mirrors combat_stat_buffs.js (which already buffs these bosses).
//
// SOUND: the actual roar .ogg is dropped at kubejs/assets/summerbuddies/sounds/beast_roar.ogg (see
// readme there). The server does NOT need the file — `/playsound` ships the id in a direct holder and the
// CLIENT resolves it from the kubejs resource pack — so the kill works even before the .ogg is added; only
// the audio is missing until then.
//
// ── KubeJS gotchas (same ones documented across the other server_scripts) ──
//   1. All server_scripts share ONE scope, so this whole file is an IIFE — no const can leak or collide.
//   2. Bosses are tracked from EntityEvents.spawned (the arena spawner-block summon fires it, same hook
//      combat_stat_buffs.js relies on). A boss alive ACROSS a full server restart would not re-fire
//      spawned and so would not roar until it reloads — acceptable for these rare admin-arena encounters.
//   3. The clock is the local tickCounter (resets on /reload → at worst an immediate first roar after a
//      reload). No persistent state needed.

(function () {
    // boss entity ids that perform the roar
    const BOSS_IDS = {
        'block_factorys_bosses:yeti': true,
        'block_factorys_bosses:kraken': true,
    }
    // every companion entity type the roar wipes
    const COMPANION_IDS = ['customcompanions:companion', 'customcompanions:companion_warrior']

    const SOUND = 'summerbuddies:beast_roar'
    const ROAR_RADIUS = 32        // blocks: companions this close to the boss die
    const HEAR_RADIUS = 64        // blocks: a player must be this close for the roar to fire (and to hear it)
    const COOLDOWN_TICKS = 300    // 15s between roars (tunable: 200 = 10s, 100 = 5s ...)
    const VOLUME = 8              // >1 widens the audible range (~volume*16 blocks)
    const PITCH = 0.7            // deep beast register

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')

    // Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
    function call0(obj, name) {
        const m = obj[name]
        return typeof m === 'function' ? obj[name]() : m
    }

    // "block_factorys_bosses:yeti" from an entity, robust to property-vs-EntityType exposure.
    function typeId(entity) {
        const t = entity.type
        if (typeof t === 'string') return t
        return String(call0(EntityTypeCls.getKey(t), 'toString'))
    }

    // True once the boss is dead/removed/unloaded (LivingEntity.isAlive() already folds in isRemoved()).
    function isGone(e) {
        try {
            if (typeof e.isAlive === 'function') return !e.isAlive()
            if (typeof e.isRemoved === 'function') return e.isRemoved()
            if (typeof e.getHealth === 'function') return e.getHealth() <= 0
        } catch (err) { return true }
        return false
    }

    // live bosses we are tracking, and the tick of their last roar — both keyed by uuid string.
    const tracked = {}
    const lastRoar = {}

    EntityEvents.spawned(event => {
        const e = event.entity
        if (e && BOSS_IDS[typeId(e)]) tracked[String(e.uuid)] = e
    })

    // Run the roar for one boss. Returns true only if it actually fired (a player was in range).
    function roar(boss) {
        let level
        try { level = boss.level } catch (err) { return false }
        if (!level || level.isClientSide()) return false
        const server = level.getServer()
        if (!server) return false

        const at = `execute as ${String(boss.uuid)} at @s `
        // Gate: only attack while a player is present in the encounter (don't wipe parked companions of
        // someone who walked away). The standalone `if entity` form returns the match count.
        const near = server.runCommandSilent(at + `if entity @a[distance=..${HEAR_RADIUS}]`)
        if (!near || near <= 0) return false

        server.runCommandSilent(
            at + `run playsound ${SOUND} hostile @a[distance=..${HEAR_RADIUS}] ~ ~ ~ ${VOLUME} ${PITCH}`)
        COMPANION_IDS.forEach(cid =>
            server.runCommandSilent(at + `run kill @e[type=${cid},distance=..${ROAR_RADIUS}]`))
        return true
    }

    let tickCounter = 0
    ServerEvents.tick(event => {
        if (++tickCounter % 20 !== 0) return   // ~once a second
        for (const key in tracked) {
            const boss = tracked[key]
            if (isGone(boss)) { delete tracked[key]; delete lastRoar[key]; continue }
            const last = lastRoar[key]
            if (last != null && (tickCounter - last) < COOLDOWN_TICKS) continue
            if (roar(boss)) lastRoar[key] = tickCounter   // consume cooldown only when it really roared
        }
    })
})()
