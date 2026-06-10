// Realm Gates — wasteland corruption: pulsing darkness while standing in realmgates:wasteland.
//
// Server-side and shader-proof: the vanilla `darkness` effect (the Deep Dark one) is implemented by
// the big shader packs (Iris/Oculus expose it as the darknessFactor uniform), so the zone stays dark
// for players running Solas/Complementary too — unlike any client lightmap trick.
//
// Re-applied every second while inside the biome; duration 70 ticks so it never visibly expires while
// you stand in the corruption, and fades on its own ~2.5 s after you leave. Hot-reload with /reload.

PlayerEvents.tick(event => {
    const player = event.player
    if (player.level.isClientSide()) return
    if (player.tickCount % 20 != 0) return

    const biomeKey = player.level.getBiome(player.blockPosition()).unwrapKey()
    if (biomeKey.isPresent() && String(biomeKey.get().location()) == 'realmgates:wasteland') {
        // duration 70t, amplifier 0, ambient: true, showParticles: false
        player.potionEffects.add('minecraft:darkness', 70, 0, true, false)
    }
})
