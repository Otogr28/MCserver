// Bosses'Rise — Sacred Beast "roar" attack: a periodic AoE that, while the boss is being fought,
// wipes the party's companions. No animation; just a beast-roar sound + the effect.
//
//   * Affects only block_factorys_bosses:yeti (Skor) and block_factorys_bosses:kraken (Nerakyss).
//   * Cadence: ONE roar right when the battle starts (the first tick a player is within HEAR_RADIUS of the
//     boss), then one more every COOLDOWN_TICKS (100s). Each roar plays summerbuddies:beast_roar and then,
//     for every customcompanions companion within ROAR_RADIUS:
//       - SPIRIT companions are NOT killed (they're immortal wisps). Instead they are "scared": we stamp
//         entity.persistentData.CCScaredUntil = now + SCARE_TICKS, which the CustomCompanions mod reads to
//         block the Spirit's ability (Envelop / slot casts) while the deadline holds. The owner is told
//         "<companion> is too scared to battle against <boss>" (once, on the transition into scared).
//       - every OTHER companion (warrior/mage/summoner) is insta-killed via Entity.kill() (genericKill,
//         bypasses invulnerability → guaranteed). Each affected owner is told "Your companion can't stand
//         <boss>" (once per roar, deduped per owner).
//   * It also stamps every PLAYER engaged in the fight (within HEAR_RADIUS of the boss) with
//     entity.persistentData.CCDuelistBlockedUntil = now + DUELIST_BLOCK_TICKS. CustomCompanions reads that tag to
//     SUPPRESS the legendary "Hitless Duelist" picto for the duration (the 1-heart glass-cannon owner build goes
//     inert vs the Sacred Beasts) — see OwnerPictoEffects.tickHitlessDuelist / DUELIST_BLOCKED_TAG.
//
// WHY KubeJS: Bosses'Rise is a third-party jar, and the player installer only syncs mods/ + kubejs/ +
// fancymenu/. A server_script applies the effect server-side and the sound rides the same kubejs/ sync.
// The only piece that lives in the mod is the "scared" gate (it has to read CCScaredUntil and deny the
// Spirit's ability) — see CustomCompanions CompanionEntity#isScared + SpiritEnvelopC2S.
//
// SOUND: kubejs/assets/summerbuddies/sounds/beast_roar.ogg (client-side; the kill/scare work without it).
//
// ── KubeJS gotchas ──
//   1. All server_scripts share ONE scope → this whole file is an IIFE (no const can leak/collide).
//   2. Bosses are tracked from EntityEvents.spawned (the arena spawner summon fires it). A boss alive
//      across a full server restart would not re-fire spawned → no roar until it reloads (rare; fine).
//   3. The roar cooldown clock is the local tickCounter (resets on /reload). The SCARED deadline uses the
//      server game-time (server.overworld().getGameTime()) so it matches the clock the mod compares against.

(function () {
    // boss entity id -> display name (for the owner messages)
    const BOSS_NAMES = {
        'block_factorys_bosses:yeti': 'Skor, the Yeti',
        'block_factorys_bosses:kraken': 'Nerakyss, the Kraken',
    }
    // companion entity types the roar reaches (warrior is its own type; everything else incl. spirit is :companion)
    const COMPANION_SET = {
        'customcompanions:companion': true,
        'customcompanions:companion_warrior': true,
    }

    const SOUND = 'summerbuddies:beast_roar'
    const ROAR_RADIUS = 32        // blocks: companions this close to the boss are hit
    const HEAR_RADIUS = 64        // blocks: a player must be this close for the roar to fire (and to hear it)
    const COOLDOWN_TICKS = 2000   // 100s between roars. The FIRST roar fires as soon as a player engages
                                  // (within ~1s of being in HEAR_RADIUS) = "at battle start"; then every 100s.
    const SCARE_TICKS = 2400      // 120s a Spirit stays scared (> the 100s roar gap, so it's kept scared
                                  // through the fight and wears off ~120s after the last roar).
    const DUELIST_BLOCK_TICKS = 2400 // 120s the Hitless Duelist picto stays suppressed for an engaged player. Same
                                  // logic as SCARE_TICKS (> the 100s roar gap), so it holds through the fight and
                                  // lapses ~120s after the last roar / once the player leaves or wins.
    const VOLUME = 8              // >1 widens the audible range (~volume*16 blocks)
    const PITCH = 0.7            // deep beast register

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')

    // Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
    function call0(obj, name) {
        const m = obj[name]
        return typeof m === 'function' ? obj[name]() : m
    }

    function typeId(entity) {
        const t = entity.type
        if (typeof t === 'string') return t
        return String(call0(EntityTypeCls.getKey(t), 'toString'))
    }

    function isGone(e) {
        try {
            if (typeof e.isAlive === 'function') return !e.isAlive()
            if (typeof e.isRemoved === 'function') return e.isRemoved()
            if (typeof e.getHealth === 'function') return e.getHealth() <= 0
        } catch (err) { return true }
        return false
    }

    // "spirit" / "warrior" / "mage" / "summoner" from the companion's persisted NBT ("" if unreadable).
    function companionClass(e) {
        try { return String(e.nbt.getString('CompanionClass')) } catch (err) { return '' }
    }

    // owner UUID string (for tellraw), or null if the companion is unowned / the key can't be read.
    function ownerUuid(e) {
        try {
            const nbt = e.nbt
            if (nbt && nbt.hasUUID('Owner')) return String(nbt.getUUID('Owner'))
        } catch (err) { /* fall through */ }
        return null
    }

    // The companion's display name (custom name if set, else its type name).
    function nameOf(e) {
        try { return String(call0(e.name, 'getString')) } catch (err) { return 'Your spirit' }
    }

    function escapeJson(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    }

    // tellraw a single player (by uuid) if online; no-op otherwise.
    function tell(server, uuid, text, color) {
        if (!uuid) return
        server.runCommandSilent(`tellraw ${uuid} {"text":"${escapeJson(text)}","color":"${color}"}`)
    }

    // live bosses we are tracking, and the tick of their last roar — both keyed by uuid string.
    const tracked = {}
    const lastRoar = {}

    EntityEvents.spawned(event => {
        const e = event.entity
        if (e && BOSS_NAMES[typeId(e)]) tracked[String(e.uuid)] = e
    })

    // Run the roar for one boss. Returns true only if it actually fired (a player was in range).
    function roar(boss) {
        let level
        try { level = boss.level } catch (err) { return false }
        if (!level || level.isClientSide()) return false
        const server = level.getServer()
        if (!server) return false

        const bossSel = `execute as ${String(boss.uuid)} at @s `
        // Gate: only attack while a player is present in the encounter (don't wipe parked companions of
        // someone who walked away). The standalone `if entity` form returns the match count.
        const near = server.runCommandSilent(bossSel + `if entity @a[distance=..${HEAR_RADIUS}]`)
        if (!near || near <= 0) return false

        // The roar itself (audio to everyone nearby).
        server.runCommandSilent(
            bossSel + `run playsound ${SOUND} hostile @a[distance=..${HEAR_RADIUS}] ~ ~ ~ ${VOLUME} ${PITCH}`)

        const bossName = BOSS_NAMES[typeId(boss)] || 'the beast'
        const now = call0(call0(server, 'overworld'), 'getGameTime') // shared across dims; matches the mod's clock
        const bx = boss.x, by = boss.y, bz = boss.z
        const r2 = ROAR_RADIUS * ROAR_RADIUS

        // Sacred Beast gate for the Hitless Duelist picto: stamp every player engaged in this fight (within
        // HEAR_RADIUS of the boss) with a future-game-time deadline. CustomCompanions reads this Forge persistent
        // tag (OwnerPictoEffects.tickHitlessDuelist / DUELIST_BLOCKED_TAG) and suppresses the picto while it holds —
        // the player twin of the CCScaredUntil gate below, so the duelist build "can't be used" vs yeti/kraken.
        const hearSq = HEAR_RADIUS * HEAR_RADIUS
        const players = level.players()
        for (let i = 0; i < players.size(); i++) {
            const p = players.get(i)
            if (p.distanceToSqr(boss) > hearSq) continue
            try { p.persistentData.putLong('CCDuelistBlockedUntil', now + DUELIST_BLOCK_TICKS) } catch (err) { /* ignore */ }
        }

        const killedOwners = {}   // owner-uuid -> true (dedupe one "can't stand" line per owner per roar)

        const entities = level.getEntities() // snapshot; safe to kill/edit during the loop
        for (let i = 0; i < entities.size(); i++) {
            const e = entities.get(i)
            if (!COMPANION_SET[typeId(e)]) continue
            const dx = e.x - bx, dy = e.y - by, dz = e.z - bz
            if (dx * dx + dy * dy + dz * dz > r2) continue

            const owner = ownerUuid(e)
            if (companionClass(e) === 'spirit') {
                // Immortal wisp: don't kill — scare it (the mod blocks its ability while CCScaredUntil holds).
                let prev = 0
                try { prev = e.persistentData.getLong('CCScaredUntil') } catch (err) { /* default 0 */ }
                try { e.persistentData.putLong('CCScaredUntil', now + SCARE_TICKS) } catch (err) { /* ignore */ }
                if (prev <= now) tell(server, owner, `${nameOf(e)} is too scared to battle against ${bossName}`, 'aqua')
            } else {
                if (owner) killedOwners[owner] = true
                try { e.kill() } catch (err) { try { e.setHealth(0) } catch (e2) { /* leave it */ } }
            }
        }

        for (const owner in killedOwners) tell(server, owner, `Your companion can't stand ${bossName}`, 'red')
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
