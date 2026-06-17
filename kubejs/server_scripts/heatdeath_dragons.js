// Heatdeath dragon rules — ONLY this dimension. Other dimensions are left completely untouched.
//
//   * Any dragon that spawns in heatdeath that is NOT a lightning dragon (fire / ice / black-frost):
//       - 30% chance it is replaced by a lightning dragon at the same spot & age,
//       - 70% chance nothing spawns (it is removed).
//   * Lightning dragons in heatdeath get DOUBLE attack damage.
//
// "No drops" is handled in config/iceandfire-common.toml ("Dragons Drop Skull/Heart/Blood = false").
// Ice and Fire generates its dragons as worldgen roosts (placed features, not structures); heatdeath
// does NOT filter Ice and Fire features (no `worldgen` block in its rule), so a fire-dragon roost CAN
// generate here — and we reuse that spawn as the trigger for the rule above.
//
// ── Two gotchas that broke the previous version, both fixed below ──
//   1. KubeJS `event.cancel()` THROWS (EventExit) to unwind the handler, so anything written AFTER it
//      never runs. The old code cancelled first and summoned the replacement after → the replacement
//      never happened (effectively 0% lightning). The summon now runs BEFORE cancel(); cancel() is last.
//   2. Ice and Fire re-bakes a dragon's attributes by growth stage (updateAttributes -> setBaseValue),
//      which wipes a plain setBaseValue() buff. We double the damage with a stable-UUID
//      MULTIPLY_TOTAL AttributeModifier instead, so it survives every re-bake and reload.

const HEATDEATH = 'realmgates:heatdeath'
const LIGHTNING = 'iceandfire:lightning_dragon'
const REPLACEABLE = ['iceandfire:fire_dragon', 'iceandfire:ice_dragon', 'iceandfire:black_frost_dragon']
const REPLACE_CHANCE = 0.30

const $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const $UUID = Java.loadClass('java.util.UUID')
const $ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

// Stable UUID so the "double damage" modifier is added exactly once and survives reloads /
// Ice and Fire's per-stage attribute re-bake.
const DMG_BUFF_UUID = $UUID.fromString('a1b2c3d4-e5f6-47a8-9c0d-1e2f3a4b5c6d')

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

// Resolve a vanilla Attribute object from its id (avoids relying on a getAttribute(String) wrapper).
function attribute(entity, id) {
    const a = $BuiltInRegistries.ATTRIBUTE.get(new $ResourceLocation(id))
    return a ? entity.getAttribute(a) : null
}

// Double attack damage via a MULTIPLY_TOTAL modifier (amount 1.0 => final = base * 2), idempotent
// by UUID so re-entry / reload never compounds or duplicates it.
function buffLightning(dragon) {
    const attack = attribute(dragon, 'minecraft:generic.attack_damage')
    if (attack && attack.getModifier(DMG_BUFF_UUID) == null) {
        attack.addPermanentModifier(
            new $AttributeModifier(DMG_BUFF_UUID, 'heatdeath_double_damage', 1.0, $Operation.MULTIPLY_TOTAL))
    }
}

// AgeTicks (IaF's real NBT key) off the source dragon, so a stage-5 fire dragon -> stage-5 lightning.
function ageOf(entity) {
    try {
        const nbt = entity.nbt
        if (nbt && nbt.contains('AgeTicks')) return nbt.getInt('AgeTicks')
    } catch (err) { /* fall through */ }
    return 90000 // adult fallback
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

    // Fire/ice/black-frost dragon in heatdeath. Roll the replacement and summon it FIRST — event.cancel()
    // below throws to unwind this handler, so nothing after it would run.
    if (Math.random() < REPLACE_CHANCE) {
        const server = call0(level, 'server')
        // The summoned lightning dragon re-enters this handler and is buffed by the LIGHTNING branch.
        server.runCommandSilent(`summon ${LIGHTNING} ${e.x} ${e.y} ${e.z} {AgeTicks:${ageOf(e)}}`)
    }
    event.cancel() // MUST be last: throws EventExit and unwinds the handler.
})
