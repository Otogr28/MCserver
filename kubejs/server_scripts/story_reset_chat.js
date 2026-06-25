// DEV reset: type  !storyreset  in chat to reset YOUR Flugel/Chapter-1 mission progress and re-test the
// lectern -> chapter12 beat. Per-player (only the one who types it). No op, no restart, no mod rebuild.
//
// Why chat and not /function or a KubeJS command:
//   - /data CANNOT modify player entities in vanilla (it silently no-ops), so a datapack function can't clear
//     the mod's "completed" set (which lives in the player's persistent NBT) — that was the earlier failure.
//   - KubeJS commands (ServerEvents.commandRegistry) only register on server START, not on /reload.
//   - But KubeJS CAN write to player.persistentData directly (the live getPersistentData() the mod reads), and
//     PlayerEvents.chat needs no registration. So a chat keyword is the only hot-reloadable, working path.
//
// IIFE-wrapped (all KubeJS server_scripts share one global scope — see the kubejs-shared-scope rule).

(function () {
    const KEYWORD = '!storyreset'
    const REASSIGN = 'primary_read_lectern'   // change to 'primary_flugel_needs_you' to restart the whole chain

    PlayerEvents.chat(event => {
        if (String(event.message).trim().toLowerCase() !== KEYWORD) return
        event.cancel()   // don't broadcast the keyword
        const p = event.player
        try {
            // 1) wipe CustomMissions progress (active + completed + claimed + counters + description) — this is the
            //    live object the mod reads via getPersistentData(), so the wipe takes effect immediately.
            const fd = p.persistentData
            const pp = fd.getCompound('PlayerPersisted')
            pp.remove('custommissions')
            fd.put('PlayerPersisted', pp)
            // 2) forget the Chapter 1-2 cinematic flag
            p.removeTag('ch1_2_seen')
            // 3) re-assign the test mission (also re-syncs the client's tracker)
            p.server.runCommandSilent(`mission assign ${p.username} ${REASSIGN}`)
            p.tell(`[storyreset] Progreso reseteado. Re-asignada: ${REASSIGN}. Anda a leer el lectern.`)
        } catch (e) {
            p.tell(`[storyreset] error: ${e}`)
        }
    })
})()
