// Realm Gates — keep configured dimensions' *natural* spawns vanilla.
//
// Cancels the natural world spawn of foreign creatures inside the listed dimensions, while every other
// dimension keeps its modded mobs. Two deliberate carve-outs so it still "feels vanilla":
//   1. SOURCE — only world-driven spawns are policed (natural / chunk gen / spawner / structure /
//      patrol / jockey). Player- or mechanic-driven spawns (summons, eggs, commands, breeding, buckets,
//      grave guardians, Ars familiars, Custom Companions...) always pass through.
//   2. NAMESPACE allowlist per dimension — mods that *reskin/replace a vanilla mob* count as vanilla
//      (Creeper Overhaul replaces the vanilla creeper; VanillaBackport registers under minecraft:).
//
// Reusable: to make a NEW dimension (v2, v3...) vanilla-mob, add ONE line below and /reload — no mod
// rebuild. This is the KubeJS half of the per-dimension setup; structures/biomes are handled by the
// Realm Gates mod (dimension JSON `worldgen` block + vanilla biome source).

// DISABLED: vanilla-mob filtering for v1 is now handled by the In Control! mod
// (config/incontrol/spawn.json), which is the single source of truth for per-dimension spawns and
// supports per-mob exceptions (e.g. Born in Chaos zombies allowed in v1). Keeping this map empty makes
// the handler a no-op for every dimension; re-add a dimension here only if you ever drop In Control.
const VANILLA_DIMENSIONS = {
    // 'realmgates:v1': ['minecraft', 'creeperoverhaul'],
}

// Spawn sources treated as "the world placing a mob"; everything else is player/mechanic driven.
const WORLD_SPAWN_TYPES = ['natural', 'chunk_generation', 'spawner', 'structure', 'patrol', 'jockey']

const $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')

// KubeJS/Rhino exposes some zero-arg Java methods as VALUE properties, not callables, so `x.foo()`
// throws "not a function, it is object" while `x.foo` yields the value. Which form applies varies by
// KubeJS build, so resolve defensively: use the property if it's already the value, else call it.
function call0(obj, name) {
    const member = obj[name]
    return typeof member === 'function' ? obj[name]() : member
}

// "realmgates:v1" from a Level, regardless of property-vs-method exposure.
function dimensionId(level) {
    return String(call0(call0(level, 'dimension'), 'location'))
}

EntityEvents.checkSpawn(event => {
    const level = event.level
    if (!level) return

    const allowedNamespaces = VANILLA_DIMENSIONS[dimensionId(level)]
    if (!allowedNamespaces) return // dimension not configured → vanilla behaviour

    const source = String(event.type).toLowerCase()
    if (!WORLD_SPAWN_TYPES.includes(source)) return // let player/mechanic spawns through

    const namespace = String(call0($EntityType.getKey(event.entity.type), 'namespace'))
    if (!allowedNamespaces.includes(namespace)) {
        event.cancel()
    }
})
