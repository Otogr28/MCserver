// Tom's Storage — re-craft everything gated behind ender pearls or nether items with
// currently-obtainable stuff (the server can't reach the Nether / get ender pearls yet).
//
// Only recipes whose stock ingredients include ender pearls or nether-sourced items are touched;
// each is rebuilt out of sticks / chest / glass / paper / diamonds and the relevant base block, so
// the progression (connector -> terminal -> wireless) is kept:
//   - ts.inventory_connector            = 8 sticks around a wooden chest          (was: ender pearl + diamond + comparator)
//   - ts.inventory_cable_connector      = 8 sticks around an inventory_connector  (was: ender pearl + quartz + diamond)
//   - ts.inventory_cable_connector_filtered = quartz -> redstone (rest unchanged) (was: quartz)
//   - ts.storage_terminal               = 8 glass around an inventory_connector   (was: glowstone + comparator)
//   - ts.wireless_terminal              = spyglass + storage_terminal + planks    (was: ender pearl + glowstone + comparator)
//   - ts.adv_wireless_terminal          = 4 diamonds around a wireless_terminal    (was: smithing w/ netherite ingot + template)
// Left untouched: crafting_terminal (diamonds only, no ender pearl/nether), and the _framed / cable
// variants. Live-reloadable: edit and /reload (server_scripts), no mod rebuild needed.

ServerEvents.recipes(event => {
    // Drop the original (ender-pearl / nether-gated) recipes by their datapack ids.
    event.remove({ id: 'toms_storage:inventory_connector' })
    event.remove({ id: 'toms_storage:inventory_cable_connector' })
    event.remove({ id: 'toms_storage:inventory_cable_connector_filtered' })
    event.remove({ id: 'toms_storage:storage_terminal' })
    event.remove({ id: 'toms_storage:wireless_terminal' })
    event.remove({ id: 'toms_storage:adv_wireless_terminal' })

    // ts.inventory_connector — sticks + any wooden chest.
    event.shaped('toms_storage:ts.inventory_connector', [
        'SSS',
        'ScS',
        'SSS'
    ], {
        S: 'minecraft:stick',
        c: '#forge:chests/wooden'
    })

    // ts.inventory_cable_connector — sticks + an inventory_connector.
    event.shaped('toms_storage:ts.inventory_cable_connector', [
        'SSS',
        'SIS',
        'SSS'
    ], {
        S: 'minecraft:stick',
        I: 'toms_storage:ts.inventory_connector'
    })

    // ts.inventory_cable_connector_filtered — same shape as stock, quartz swapped for redstone.
    event.shaped('toms_storage:ts.inventory_cable_connector_filtered', [
        ' r ',
        'pcp',
        ' r '
    ], {
        r: 'minecraft:redstone',
        p: 'minecraft:paper',
        c: 'toms_storage:ts.inventory_cable_connector'
    })

    // ts.storage_terminal — glass screen around an inventory_connector.
    event.shaped('toms_storage:ts.storage_terminal', [
        'ggg',
        'gIg',
        'ggg'
    ], {
        g: '#forge:glass',
        I: 'toms_storage:ts.inventory_connector'
    })

    // ts.wireless_terminal — storage_terminal + spyglass (the "wireless" part), framed in planks.
    event.shaped('toms_storage:ts.wireless_terminal', [
        ' a ',
        'PTP',
        ' P '
    ], {
        a: 'minecraft:spyglass',
        T: 'toms_storage:ts.storage_terminal',
        P: '#minecraft:planks'
    })

    // ts.adv_wireless_terminal — was a netherite smithing upgrade; now diamonds around a wireless_terminal.
    event.shaped('toms_storage:ts.adv_wireless_terminal', [
        ' d ',
        'dWd',
        ' d '
    ], {
        d: '#forge:gems/diamond',
        W: 'toms_storage:ts.wireless_terminal'
    })
})
