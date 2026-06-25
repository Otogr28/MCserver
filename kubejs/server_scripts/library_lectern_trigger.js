// Library lectern -> Chapter 1-2 cinematic trigger.
//
// When a player CLOSES the library lectern at 344/134/1064 (closes it, not opens it), 5 seconds later
// the existing StoryKit story `chapter12` plays for them. Once per player (a `ch1_2_seen` scoreboard
// tag gates replays across relogs). We do NOT own/modify the `chapter12` story itself — we only fire it.
//
// "Close" detection: poll each player's open menu each server tick. While reading a lectern the menu is a
// LecternMenu; the tick it stops being a LecternMenu (and the player is still next to the lectern) is the
// close. The 5 s delay is scheduled here, so the `chapter12` story needs no leading wait.
//
// IIFE-wrapped (all KubeJS server_scripts share one global scope — see the kubejs-shared-scope rule).

(function () {
    const LX = 344, LY = 134, LZ = 1064
    const NEAR_SQ = 36          // 6 blocks
    const DELAY_TICKS = 100     // 5 seconds

    const lecternOpen = {}      // uuid -> was a lectern menu open last tick
    const pending = {}          // uuid -> { at: <serverTick>, name: <username> }
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

    ServerEvents.tick(event => {
        serverTick++
        const server = event.server

        server.players.forEach(p => {
            let id
            try { id = p.uuid.toString() } catch (e) { return }

            const now = isLecternMenu(p)
            const was = lecternOpen[id] === true
            lecternOpen[id] = now

            // Lectern menu just CLOSED.
            if (was && !now && pending[id] === undefined) {
                let near = false
                try { near = p.distanceToSqr(LX + 0.5, LY + 0.5, LZ + 0.5) <= NEAR_SQ } catch (e) {}
                let seen = false
                try { seen = p.tags.contains('ch1_2_seen') } catch (e) {}
                if (near && !seen) {
                    pending[id] = { at: serverTick + DELAY_TICKS, name: p.username }
                }
            }
        })

        // Fire any cinematics whose 5 s delay has elapsed.
        for (const id in pending) {
            if (serverTick >= pending[id].at) {
                const name = pending[id].name
                server.runCommandSilent(`tag ${name} add ch1_2_seen`)
                server.runCommandSilent(`story play chapter12 ${name}`)
                delete pending[id]
            }
        }
    })
})()
