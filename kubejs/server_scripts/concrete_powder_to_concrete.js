// Concrete powder -> concrete, fast & easy (no water dance, no mining).
//
// Vanilla forces you to place concrete powder next to water, wait for it to harden, then mine it back.
// This adds a 1:1 SHAPELESS crafting recipe per color: drop a concrete_powder anywhere in the grid and
// it instantly becomes the matching concrete block. Also a furnace/blast-furnace smelting recipe so a
// whole stack can be "dried" in bulk with fuel.
//
// Single-ingredient shapeless recipes are unique per item (the input differs by color), so no
// crafting-grid conflicts. Recipes sync server -> client, so players need nothing extra installed.
//
// Live-reloadable from a COLD START only: a server (re)start loads this file fresh. To apply without a
// full restart run `/kubejs reload server_scripts` then `/reload`.

ServerEvents.recipes(event => {
    const COLORS = [
        'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
        'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'
    ]

    COLORS.forEach(color => {
        const powder = `minecraft:${color}_concrete_powder`
        const concrete = `minecraft:${color}_concrete`

        // Instant: 1 powder anywhere in the crafting grid -> 1 concrete. No water needed.
        event.shapeless(concrete, [powder])

        // Bulk: smelt/blast a stack of powder into concrete (heat "dries" it). Blast furnace is 2x faster.
        event.smelting(concrete, powder)
        event.blasting(concrete, powder)
    })
})
