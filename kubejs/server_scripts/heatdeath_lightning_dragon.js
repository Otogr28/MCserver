// Lightning dragon tuning. It's the only dragon left to spawn: In Control
// (config/incontrol/spawn.json) denies fire/ice/black-frost dragons everywhere.
//
//  - 3000 max health.
//  - No drops: skull/heart/blood are turned off in config/iceandfire-common.toml (Ice and Fire
//    drops those via its own death code, not loot tables, so that's the reliable lever).
//
// Ice and Fire sets dragon health from its growth stage, so we override the max-health attribute
// when the dragon spawns. Freshly-spawned dragons keep 3000; if a growing/reloaded one ever reverts,
// a periodic re-assert can be added.
const LIGHTNING_DRAGON = 'iceandfire:lightning_dragon'

EntityEvents.spawned(event => {
    const entity = event.entity
    if (!entity || entity.type !== LIGHTNING_DRAGON) return
    const maxHealth = entity.getAttribute('minecraft:generic.max_health')
    if (maxHealth) {
        maxHealth.setBaseValue(3000)
        entity.setHealth(3000)
    }
})
