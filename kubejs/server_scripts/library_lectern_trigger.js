// Library lectern -> completes the "read the lectern" objective AND fires the Chapter 1-2 cinematic,
// BOTH when the player CLOSES the lectern (not when they open it).
//
// Flow per player (armed by right-clicking the lectern at 344/134/1064):
//   waitOpen  : wait until the lectern menu is actually open (or 3 s grace if the menu can't be read)
//   waitClose : wait until it's no longer open (= they closed it) -> emit `mission signal read_lectern`
//               (completes the objective ON CLOSE) and schedule the cinematic 5 s later
//   waitCine  : after the 5 s, run `story play chapter12` (once per player, gated by a `ch1_2_seen` tag)
// A 15 s hard cap on waitClose guarantees it always resolves even if the menu state can't be polled.
// We never own/modify the `chapter12` story — we only fire it.
//
// IIFE-wrapped (all KubeJS server_scripts share one global scope — see the kubejs-shared-scope rule).

(function () {
    const LX = 344, LY = 134, LZ = 1064
    const SEEN_TAG = 'ch1_2_seen'
    const OPEN_GRACE = 60       // 3 s: assume opened if the menu can't be read
    const CLOSE_CAP = 300       // 15 s: resolve no matter what
    const CINE_DELAY = 100      // 5 s after close

    const armed = {}            // uuid -> { name, openTick, phase, cineAt }
    let serverTick = 0

    function isLecternMenu(p) {
        try {
            const m = p.containerMenu
            if (!m) return false
            const n = m.getClass().getSimpleName()
            return !!n && n.toLowerCase().indexOf('lectern') >= 0
        } catch (e) {
            return false
        }
    }

    // Right-click the library lectern -> ARM (no completion yet; that happens on close).
    BlockEvents.rightClicked(event => {
        const b = event.block
        if (!b || b.x !== LX || b.y !== LY || b.z !== LZ) return
        if (String(b.id) !== 'minecraft:lectern') return
        const p = event.player
        let level
        try { level = p.level } catch (e) { return }
        if (!p || !level || level.isClientSide()) return
        let id
        try { id = p.uuid.toString() } catch (e) { return }
        let seen = false
        try { seen = p.tags.contains(SEEN_TAG) } catch (e) {}
        if (!seen && armed[id] === undefined) {
            armed[id] = { name: p.username, openTick: serverTick, phase: 'waitOpen' }
        }
    })

    ServerEvents.tick(event => {
        serverTick++
        const server = event.server
        server.players.forEach(p => {
            let id
            try { id = p.uuid.toString() } catch (e) { return }
            const a = armed[id]
            if (!a) return
            const age = serverTick - a.openTick

            if (a.phase === 'waitOpen') {
                if (isLecternMenu(p) || age >= OPEN_GRACE) {
                    a.phase = 'waitClose'
                }
            } else if (a.phase === 'waitClose') {
                if (!isLecternMenu(p) || age >= CLOSE_CAP) {
                    // CLOSED -> complete the read objective now, and schedule the cinematic.
                    server.runCommandSilent(`mission signal read_lectern 1 ${a.name}`)
                    a.cineAt = serverTick + CINE_DELAY
                    a.phase = 'waitCine'
                }
            } else if (a.phase === 'waitCine') {
                if (serverTick >= a.cineAt) {
                    server.runCommandSilent(`tag ${a.name} add ${SEEN_TAG}`)
                    server.runCommandSilent(`story play chapter12 ${a.name}`)
                    delete armed[id]
                }
            }
        })
    })
})()
