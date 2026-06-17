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
// ── Three gotchas that broke earlier versions, all fixed below ──
//   1. ROOT CAUSE the script never ran: KubeJS loads every server_script in ONE shared scope, so a
//      top-level `const $EntityType` here collided with the same const in v1_vanilla_mobs.js
//      ("redeclaration of const $EntityType") → the whole file threw on load and EntityEvents.spawned
//      was never registered. The entire script is now wrapped in an IIFE so nothing leaks to that
//      shared scope and no name can ever collide with another server_script.
//   2. KubeJS `event.cancel()` THROWS (EventExit) to unwind the handler, so anything written AFTER it
//      never runs. The replacement summon must happen BEFORE cancel(); cancel() is the last statement.
//   3. Ice and Fire re-bakes a dragon's attributes by growth stage (updateAttributes -> setBaseValue),
//      which wipes a plain setBaseValue() buff. We double the damage with a stable-UUID
//      MULTIPLY_TOTAL AttributeModifier instead, so it survives every re-bake and reload.

(function () {
    const HEATDEATH = 'realmgates:heatdeath'
    const LIGHTNING = 'iceandfire:lightning_dragon'
    const REPLACEABLE = ['iceandfire:fire_dragon', 'iceandfire:ice_dragon', 'iceandfire:black_frost_dragon']
    const REPLACE_CHANCE = 0.30

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')
    const AttributeModifierCls = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
    const OperationCls = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
    const UUIDCls = Java.loadClass('java.util.UUID')
    const ResourceLocationCls = Java.loadClass('net.minecraft.resources.ResourceLocation')
    const BuiltInRegistriesCls = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

    // Stable UUID so the "double damage" modifier is added exactly once and survives reloads /
    // Ice and Fire's per-stage attribute re-bake.
    const DMG_BUFF_UUID = UUIDCls.fromString('a1b2c3d4-e5f6-47a8-9c0d-1e2f3a4b5c6d')

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
        return String(call0(EntityTypeCls.getKey(t), 'toString'))
    }

    // Resolve a vanilla Attribute object from its id (avoids relying on a getAttribute(String) wrapper).
    function attribute(entity, id) {
        const a = BuiltInRegistriesCls.ATTRIBUTE.get(new ResourceLocationCls(id))
        return a ? entity.getAttribute(a) : null
    }

    // Double attack damage via a MULTIPLY_TOTAL modifier (amount 1.0 => final = base * 2), idempotent
    // by UUID so re-entry / reload never compounds or duplicates it.
    function buffLightning(dragon) {
        const attack = attribute(dragon, 'minecraft:generic.attack_damage')
        if (attack && attack.getModifier(DMG_BUFF_UUID) == null) {
            attack.addPermanentModifier(
                new AttributeModifierCls(DMG_BUFF_UUID, 'heatdeath_double_damage', 1.0, OperationCls.MULTIPLY_TOTAL))
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

        // Fire/ice/black-frost dragon in heatdeath. Roll the replacement and summon it FIRST —
        // event.cancel() below throws to unwind this handler, so nothing after it would run.
        if (Math.random() < REPLACE_CHANCE) {
            const server = call0(level, 'server')
            // The summoned lightning dragon re-enters this handler and is buffed by the LIGHTNING branch.
            server.runCommandSilent(`summon ${LIGHTNING} ${e.x} ${e.y} ${e.z} {AgeTicks:${ageOf(e)}}`)
        }
        event.cancel() // MUST be last: throws EventExit and unwinds the handler.
    })

    // ── Worldgen dragons too ────────────────────────────────────────────────────────────────────
    // EntityEvents.spawned only catches fresh/summoned entities. Ice and Fire's dragons come from
    // worldgen ROOSTS (placed during chunk gen, loaded with the chunk), which that event misses — so a
    // wild fire dragon could still appear in heatdeath. Once a second we sweep heatdeath's loaded
    // entities and apply the same rule to any dragon that slipped through (remove non-lightning, 30%
    // replace with a lightning; ensure lightnings are buffed). discard() = remove, no death drops.
    const HEATDEATH_RL = new ResourceLocationCls(HEATDEATH)
    let tickCounter = 0
    ServerEvents.tick(event => {
        if (++tickCounter % 20 !== 0) return   // ~once a second
        const server = event.server
        const level = server.getLevel(HEATDEATH_RL)
        if (!level) return
        const entities = level.getEntities()   // snapshot, safe to discard/summon during the loop
        for (let i = 0; i < entities.size(); i++) {
            const e = entities.get(i)
            const type = typeId(e)
            if (type === LIGHTNING) { buffLightning(e); continue }
            if (REPLACEABLE.indexOf(type) === -1) continue
            if (Math.random() < REPLACE_CHANCE) {
                server.runCommandSilent(`summon ${LIGHTNING} ${e.x} ${e.y} ${e.z} {AgeTicks:${ageOf(e)}}`)
            }
            e.discard()
        }
    })
})()
