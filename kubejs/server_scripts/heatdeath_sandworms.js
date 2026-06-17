// Heatdeath giant sandworms — ONLY this dimension. Other dimensions are left completely untouched.
//
// Ice and Fire's Death Worm (iceandfire:deathworm) is the desert "sandworm". It spawns via a worldgen
// feature (iceandfire:spawn_death_worm) on sandy ground, so heatdeath's deserts breed them on their own
// (heatdeath does NOT filter Ice and Fire features). This script makes every one that appears in heatdeath
// a GIANT: we set its scale, and Ice and Fire scales the worm's max health and attack damage by that scale
// (base 10 HP / 3 attack -> ~45 HP / ~13.5 attack at scale 4.5), and heals it to the new max. The result is
// a desert mini-boss instead of a regular worm.
//
// Why setDeathWormScale and not attribute modifiers (unlike the dragons): Death Worms derive HP/damage from
// their scale (EntityDeathWorm#updateAttributes does maxHealth = base*scale, attack = base*scale). Crucially
// their per-tick aiStep re-asserts the CURRENT scale (setDeathWormScale(getDeathwormScale())), it does NOT
// recompute it from age — so a scale we set at spawn sticks, and the scaled HP/damage stick with it. One call
// gives "giant + more health + more damage" through the mod's own system.
//
// KubeJS gotcha (same as heatdeath_dragons.js): every server_script shares one scope, so this whole file is
// wrapped in an IIFE — nothing leaks to the shared scope and no `const` can collide with another script.

(function () {
    const HEATDEATH = 'realmgates:heatdeath'
    const DEATHWORM = 'iceandfire:deathworm'
    const SCALE = 4.5   // giant; HP/damage scale with this. Brutal preset, tune freely.

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')
    const ResourceLocationCls = Java.loadClass('net.minecraft.resources.ResourceLocation')

    // Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
    function call0(obj, name) {
        const m = obj[name]
        return typeof m === 'function' ? obj[name]() : m
    }

    // "realmgates:heatdeath" from a Level.
    function dimId(level) {
        return String(call0(call0(level, 'dimension'), 'location'))
    }

    // "iceandfire:deathworm" from an entity, robust to property-vs-EntityType exposure.
    function typeId(entity) {
        const t = entity.type
        if (typeof t === 'string') return t
        return String(call0(EntityTypeCls.getKey(t), 'toString'))
    }

    // Make a worm giant (idempotent: only re-scales if it isn't already). setDeathWormScale rebakes
    // HP/damage from scale and heals to the new max; aiStep keeps re-asserting this scale every tick, so
    // the giant size (and its tougher stats) persist for the worm's whole life.
    function makeGiant(e) {
        if (typeof e.setDeathWormScale !== 'function') return
        let cur = 0
        try { cur = e.getDeathwormScale() } catch (err) { cur = 0 }
        if (cur < SCALE - 0.01) e.setDeathWormScale(SCALE)
    }

    EntityEvents.spawned(event => {
        const e = event.entity
        if (!e) return
        let level
        try { level = e.level } catch (err) { return }
        if (!level || dimId(level) !== HEATDEATH) return
        if (typeId(e) !== DEATHWORM) return
        makeGiant(e)
    })

    // ── Worldgen worms too ──────────────────────────────────────────────────────────────────────
    // EntityEvents.spawned catches summoned/fresh worms, but Death Worms also come from a worldgen
    // spawn feature (loaded with the chunk), which that event misses. Once a second, sweep heatdeath's
    // loaded entities and make any non-giant worm giant.
    const HEATDEATH_RL = new ResourceLocationCls(HEATDEATH)
    let wormTick = 0
    ServerEvents.tick(event => {
        if (++wormTick % 20 !== 0) return   // ~once a second
        const level = event.server.getLevel(HEATDEATH_RL)
        if (!level) return
        const entities = level.getEntities()
        for (let i = 0; i < entities.size(); i++) {
            const e = entities.get(i)
            if (typeId(e) === DEATHWORM) makeGiant(e)
        }
    })
})()
