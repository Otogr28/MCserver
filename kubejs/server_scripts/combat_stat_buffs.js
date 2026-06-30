// Combat stat buffs — multiply max-health and attack-damage of specific tough enemies on spawn.
//
// Applied as stable-UUID MULTIPLY_TOTAL attribute modifiers (idempotent, reload-safe):
//   * realmgates:shade               (the wasteland's shadow stalker)     HP x2.5, DMG x2
//   * block_factorys_bosses:yeti     (Skor, The Yeti)        HP x14 (250->3500), DMG ->120 (x6.667 of base 18)
//   * block_factorys_bosses:kraken   (Nerakyss, The Kraken)  HP x12 (500->6000), DMG ->120 (x12 of base 10)
//
// NOTE: yeti 3500 / kraken 6000 HP exceed vanilla's MAX_HEALTH cap of 1024 → they only reach those values
// with AttributeFix installed (raises the attribute suprema). Without it, MAX_HEALTH clamps to 1024.
// The DMG targets (both 120, written as 120/base so the MULTIPLY_TOTAL lands exactly on 120) are well
// under the 2048 ATTACK_DAMAGE cap.
//
// WHY this lives in KubeJS and not in each mod's own config:
//   - The shade's stats are HARDCODED in the Realm Gates jar (ShadeEntity.createAttributes: 30 HP / 5 ATK),
//     there is no config knob for them.
//   - Bosses'Rise reads its boss stats from a per-world Forge SERVER config, but the player installer only
//     syncs mods/ + kubejs/ + fancymenu/ (NOT config/), so a toml change would never reach the players who
//     fight these bosses client-side. A server_script rides that same sync and applies in every world.
//
// HOW: a MULTIPLY_TOTAL modifier with amount (mult-1) makes final = base * mult, and it stays on the
// attribute so it survives any later setBaseValue() the mod does (the bosses set their own health from
// config on spawn = their base). Raising MAX_HEALTH does not heal, so after the health buff we top the
// entity off to its new full health.
//
// CAVEAT: per the mod's own config comment ("Not all damages sources depends on this variable !"), some
// scripted boss attacks use fixed damage and won't scale — this buffs the base melee/health, the main lever.
//
// ── KubeJS gotchas (same ones documented in heatdeath_dragons.js) ──
//   1. All server_scripts share ONE scope → this whole file is an IIFE so no const leaks or collides.
//   2. Some zero-arg Java getters are exposed as values, others as methods → call0() resolves either.
//   3. getAttribute(String) is not reliable → resolve the vanilla Attribute object from BuiltInRegistries.

(function () {
    // entity id -> { hp: max-health multiplier, dmg: attack-damage multiplier }
    const BUFFS = {
        'realmgates:shade':             { hp: 2.5,  dmg: 2.0 },
        'block_factorys_bosses:yeti':   { hp: 14.0, dmg: 120 / 18 },
        'block_factorys_bosses:kraken': { hp: 12.0, dmg: 120 / 10 },
    }

    const EntityTypeCls = Java.loadClass('net.minecraft.world.entity.EntityType')
    const AttributeModifierCls = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
    const OperationCls = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
    const UUIDCls = Java.loadClass('java.util.UUID')
    const ResourceLocationCls = Java.loadClass('net.minecraft.resources.ResourceLocation')
    const BuiltInRegistriesCls = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

    // Stable UUIDs so each buff is added exactly once per attribute instance and never compounds on reload.
    const HP_BUFF_UUID = UUIDCls.fromString('b7e4d1a0-2c33-4f8e-9a11-7d6c5b4a3e21')
    const DMG_BUFF_UUID = UUIDCls.fromString('c8f5e2b1-3d44-40af-8b22-6e7d4c5b2f10')

    // Rhino exposes some zero-arg Java getters as values, others as methods; resolve either way.
    function call0(obj, name) {
        const m = obj[name]
        return typeof m === 'function' ? obj[name]() : m
    }

    // "block_factorys_bosses:yeti" from an entity, robust to property-vs-EntityType exposure.
    function typeId(entity) {
        const t = entity.type
        if (typeof t === 'string') return t
        // `entity.type` is normally the registry-id string; some mods (e.g. Creeper Overhaul) expose a
        // public `type` field that shadows it in Rhino → getKey() on a non-EntityType threw a
        // ResourceLocationException on EVERY spawn (this spawned handler runs typeId on every entity).
        // Resolve via the canonical getType() instead, and treat anything unresolvable as '' (matches nothing).
        try { return String(call0(EntityTypeCls.getKey(call0(entity, 'getType')), 'toString')) } catch (err) { return '' }
    }

    // Resolve a vanilla Attribute object from its id (avoids relying on a getAttribute(String) wrapper).
    function attribute(entity, id) {
        const a = BuiltInRegistriesCls.ATTRIBUTE.get(new ResourceLocationCls(id))
        return a ? entity.getAttribute(a) : null
    }

    // final = base * mult (MULTIPLY_TOTAL amount = mult - 1), idempotent by UUID. Returns true if applied.
    function applyMult(inst, uuid, name, mult) {
        if (inst && mult !== 1.0 && inst.getModifier(uuid) == null) {
            inst.addPermanentModifier(
                new AttributeModifierCls(uuid, name, mult - 1.0, OperationCls.MULTIPLY_TOTAL))
            return true
        }
        return false
    }

    EntityEvents.spawned(event => {
        const e = event.entity
        if (!e) return
        const cfg = BUFFS[typeId(e)]
        if (!cfg) return

        applyMult(attribute(e, 'minecraft:generic.attack_damage'), DMG_BUFF_UUID, 'combat_buff_damage', cfg.dmg)

        const hp = attribute(e, 'minecraft:generic.max_health')
        if (applyMult(hp, HP_BUFF_UUID, 'combat_buff_health', cfg.hp)) {
            // The boss spawned at its un-buffed base health; top it off to the new full so it starts at max.
            try { e.setHealth(hp.getValue()) } catch (err) { /* no setHealth on this wrapper: leave as-is */ }
        }
    })
})()
