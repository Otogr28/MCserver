// Heatdeath dragon rules — ONLY this dimension. Other dimensions are left completely untouched.
//
//   * Any NON-lightning dragon (fire / ice / black-frost) that spawns in heatdeath:
//       - 30% chance it is replaced by a lightning dragon (same spot/age),
//       - 70% chance nothing spawns (it is removed).
//   * Lightning dragons in heatdeath get buffed: 3000 max health + DOUBLE attack damage.
//
// "No drops" is handled in config/iceandfire-common.toml ("Dragons Drop Skull/Heart/Blood = false").
// Dragons only ever spawn in heatdeath (v1 denies Ice and Fire; the other dims have no dragon biomes),
// so that global toggle is effectively heatdeath-only.
//
// NOTE: Ice and Fire dragons have custom health/damage/drop code; this is best-effort and was written to
// be verified in-game (summon a fire/lightning dragon in heatdeath and check).

const HEATDEATH = 'realmgates:heatdeath'
const LIGHTNING = 'iceandfire:lightning_dragon'
const REPLACEABLE = ['iceandfire:fire_dragon', 'iceandfire:ice_dragon', 'iceandfire:black_frost_dragon']
const REPLACE_CHANCE = 0.30

const $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')

// Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
function call0(obj, name) {
    const m = obj[name]
    return typeof m === 'function' ? obj[name]() : m
}

// "realmgates:heatdeath" from a Level.
function dimId(level) {
    return String(call0(call0(level, 'dimension'), 'location'))
}

// "iceandfire:lightning_dragon" from an entity, robust to property-vs-EntityType exposure.
function typeId(entity) {
    const t = entity.type
    if (typeof t === 'string') return t
    return String(call0($EntityType.getKey(t), 'toString'))
}

function buffLightning(dragon) {
    const maxHealth = dragon.getAttribute('minecraft:generic.max_health')
    if (maxHealth) {
        maxHealth.setBaseValue(3000)
        dragon.setHealth(3000)
    }
    // Double attack damage ONCE (flag in persistent data so a chunk reload doesn't compound it).
    const pd = dragon.persistentData
    if (!pd.getBoolean('heatdeathBuffed')) {
        const attack = dragon.getAttribute('minecraft:generic.attack_damage')
        if (attack) attack.setBaseValue(attack.getBaseValue() * 2)
        pd.putBoolean('heatdeathBuffed', true)
    }
}

EntityEvents.spawned(event => {
    const e = event.entity
    if (!e) return
    let level
    try { level = e.level } catch (err) { return }
    if (!level || dimId(level) !== HEATDEATH) return

    const type = typeId(e)

    if (type === LIGHTNING) {
        buffLightning(e)
        return
    }
    if (REPLACEABLE.indexOf(type) === -1) return

    // A fire/ice/black-frost dragon spawned in heatdeath → remove it, maybe replace with a lightning one.
    event.cancel()
    if (Math.random() < REPLACE_CHANCE) {
        const age = (e.nbt && e.nbt.AgeTicks !== undefined) ? e.nbt.AgeTicks : 90000
        const server = call0(level, 'server')
        server.runCommandSilent(`summon ${LIGHTNING} ${e.x} ${e.y} ${e.z} {AgeTicks:${age}}`)
        // the summoned lightning dragon re-enters this handler and gets buffed by the lightning branch
    }
})
