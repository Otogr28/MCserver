// Heatdeath sandworms scale with WARMTH — ONLY this dimension. Other dimensions are left untouched.
//
// Ice and Fire's Death Worm (iceandfire:deathworm) is the desert "sandworm". They reach heatdeath two ways:
//   1) realmgates' WarmthSpawner conjures them as part of the warmth waves (small at low warmth, giant high),
//   2) Ice and Fire's own worldgen feature breeds them on sandy ground.
// Either way, this script sizes each worm ONCE to the heat of the nearest player: a baby at low warmth,
// a desert mini-boss at 100%, and a monstrous one in overcharge (100%+). Death Worms derive HP/damage from
// scale (EntityDeathWorm#updateAttributes: maxHealth = base*scale, attack = base*scale; base 10 HP / 3 atk),
// and their aiStep re-asserts the CURRENT scale (it does NOT recompute from age) — so one setDeathWormScale
// at spawn sticks for the worm's whole life. We scale ONCE (flag in persistentData) so we never re-heal it.
//
// Warmth lives in the player's persistent data as a float `realmgatesWarmth` (0..1 normal, up to maxWarmth
// in overcharge), written by env.Warmth. We read it straight off the nearest player.
//
// KubeJS gotcha (same as heatdeath_dragons.js): every server_script shares one scope, so this whole file is
// wrapped in an IIFE — nothing leaks and no `const` can collide with another script.

(function () {
    const HEATDEATH = 'realmgates:heatdeath'
    const DEATHWORM = 'iceandfire:deathworm'
    const SCALED_FLAG = 'rgWormScaled'      // set once per worm so we size it a single time
    const RANGE_SQ = 80 * 80                // only size a worm when a player is within this (blocks²)

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')
    const ResourceLocationCls = Java.loadClass('net.minecraft.resources.ResourceLocation')

    // Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
    function call0(obj, name) {
        const m = obj[name]
        return typeof m === 'function' ? obj[name]() : m
    }

    function dimId(level) {
        return String(call0(call0(level, 'dimension'), 'location'))
    }

    function typeId(entity) {
        const t = entity.type
        if (typeof t === 'string') return t
        // `entity.type` is normally the registry-id string; some mods (e.g. Creeper Overhaul) expose a
        // public `type` field that shadows it in Rhino → getKey() on a non-EntityType throws a
        // ResourceLocationException. Resolve via the canonical getType() and treat anything unresolvable
        // as '' (this script dim-gates before typeId, so it doesn't spam, but keep it robust/consistent).
        try { return String(call0(EntityTypeCls.getKey(call0(entity, 'getType')), 'toString')) } catch (err) { return '' }
    }

    function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v) }

    // baby at low warmth → giant (4.5) at 100% → monstrous (up to 6.5) in overcharge.
    function scaleFor(w) {
        let s = 1.0 + 3.5 * clamp01(w)
        if (w > 1.0) s += 2.0 * clamp01(w - 1.0)
        return s
    }

    // Warmth of the closest player (within RANGE_SQ), or -1 if nobody is near enough yet.
    function nearestWarmth(level, worm) {
        const players = level.players()
        let bestSq = -1
        let bestWarmth = 0
        for (let i = 0; i < players.size(); i++) {
            const p = players.get(i)
            const d = p.distanceToSqr(worm)
            if (bestSq < 0 || d < bestSq) {
                bestSq = d
                bestWarmth = p.persistentData.getFloat('realmgatesWarmth')
            }
        }
        if (bestSq < 0 || bestSq > RANGE_SQ) return -1
        return bestWarmth
    }

    // Size a worm ONCE, to the nearest player's warmth. No player near → leave it for a later sweep.
    function sizeByWarmth(e, level) {
        if (typeof e.setDeathWormScale !== 'function') return
        const pd = e.persistentData
        if (pd.getBoolean(SCALED_FLAG)) return
        const w = nearestWarmth(level, e)
        if (w < 0) return
        e.setDeathWormScale(scaleFor(w))
        pd.putBoolean(SCALED_FLAG, true)
    }

    EntityEvents.spawned(event => {
        const e = event.entity
        if (!e) return
        let level
        try { level = e.level } catch (err) { return }
        if (!level || dimId(level) !== HEATDEATH) return
        if (typeId(e) !== DEATHWORM) return
        sizeByWarmth(e, level)   // warmth-spawned worms have the player right here, so they size immediately
    })

    // ── Worldgen worms (and any that spawned with nobody near) ──────────────────────────────────────
    // EntityEvents.spawned misses worms loaded with a chunk, and a worm that spawned far from players has no
    // warmth to read yet. Sweep heatdeath's loaded worms once a second and size any not-yet-sized one as soon
    // as a player gets close.
    const HEATDEATH_RL = new ResourceLocationCls(HEATDEATH)
    let wormTick = 0
    ServerEvents.tick(event => {
        if (++wormTick % 20 !== 0) return   // ~once a second
        const level = event.server.getLevel(HEATDEATH_RL)
        if (!level) return
        const entities = level.getEntities()
        for (let i = 0; i < entities.size(); i++) {
            const e = entities.get(i)
            if (typeId(e) === DEATHWORM) sizeByWarmth(e, level)
        }
    })
})()
