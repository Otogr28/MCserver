// Tom's Storage — full recipe sweep: every item craftable with currently-obtainable materials.
//
// The server can't reach the Nether / get ender pearls / quartz / netherite right now, and several
// stock recipes gate behind those. Rather than patch a few, we WIPE all toms_storage recipes
// (event.remove({mod})) and re-add a curated set built only from sticks / planks / wooden rods /
// chests / trapdoors / glass / redstone / wool / iron(hopper) / paper / dyes / buckets / diamonds and
// the relevant Tom's base block, keeping the progression connector -> cable -> terminal -> wireless.
//
// IMPORTANT: every recipe below is UNIQUE — no two share the same shaped pattern+ingredient map (they
// differ by their center item or at least one ingredient) and no two shapeless recipes share the same
// ingredient multiset. That avoids crafting-grid conflicts (two outputs from one pattern).
//
// Live-reloadable from a COLD START only: a server (re)start loads this file fresh and applies it.
// A vanilla /reload re-fires the recipe event but does NOT re-read a newly-added script file; to apply
// without a full restart run `/kubejs reload server_scripts` then `/reload`.

ServerEvents.recipes(event => {
    // Clean slate: drop every toms_storage recipe, then re-add our curated cheap+unique set below.
    event.remove({ mod: 'toms_storage' })

    // ---- base network pieces ------------------------------------------------------------------
    // inventory_connector — sticks around a wooden chest (the network "brain").
    event.shaped('toms_storage:ts.inventory_connector', [
        'SSS',
        'ScS',
        'SSS'
    ], { S: 'minecraft:stick', c: '#forge:chests/wooden' })

    // inventory_cable (x6) — stick/plank checkerboard.
    event.shaped(Item.of('toms_storage:ts.inventory_cable', 6), [
        'SPS',
        'PSP',
        'SPS'
    ], { S: 'minecraft:stick', P: '#minecraft:planks' })

    // inventory_cable_connector — sticks around an inventory_connector.
    event.shaped('toms_storage:ts.inventory_cable_connector', [
        'SSS',
        'SIS',
        'SSS'
    ], { S: 'minecraft:stick', I: 'toms_storage:ts.inventory_connector' })

    // inventory_cable_connector_filtered — paper + redstone around a cable_connector.
    event.shaped('toms_storage:ts.inventory_cable_connector_filtered', [
        ' r ',
        'pKp',
        ' r '
    ], { r: 'minecraft:redstone', p: 'minecraft:paper', K: 'toms_storage:ts.inventory_cable_connector' })

    // inventory_cable_connector_framed — stick frame around a cable_connector.
    event.shaped('toms_storage:ts.inventory_cable_connector_framed', [
        'S S',
        ' K ',
        'S S'
    ], { S: 'minecraft:stick', K: 'toms_storage:ts.inventory_cable_connector' })

    // inventory_cable_framed — stick frame around a cable.
    event.shaped('toms_storage:ts.inventory_cable_framed', [
        'S S',
        ' L ',
        'S S'
    ], { S: 'minecraft:stick', L: 'toms_storage:ts.inventory_cable' })

    // inventory_hopper_basic — planks + cable + hopper.
    event.shaped('toms_storage:ts.inventory_hopper_basic', [
        'PLP',
        ' H '
    ], { P: '#minecraft:planks', L: 'toms_storage:ts.inventory_cable', H: 'minecraft:hopper' })

    // inventory_proxy — trapdoors + planks around a chest.
    event.shaped('toms_storage:ts.inventory_proxy', [
        'PTP',
        'TcT',
        'PTP'
    ], { P: '#minecraft:planks', T: '#minecraft:trapdoors', c: '#forge:chests/wooden' })

    // ---- filters ------------------------------------------------------------------------------
    // item_filter — redstone corners, stick edges, wool center.
    event.shaped('toms_storage:ts.item_filter', [
        'rSr',
        'SwS',
        'rSr'
    ], { r: 'minecraft:redstone', S: 'minecraft:stick', w: '#minecraft:wool' })

    // polymorphic_item_filter — item_filter + redstone + diamond (was comparator + diamond).
    event.shapeless('toms_storage:ts.polymorphic_item_filter', [
        'toms_storage:ts.item_filter',
        'minecraft:redstone',
        'minecraft:diamond'
    ])

    // tag_item_filter — item_filter + redstone + name_tag (was comparator + name_tag).
    event.shapeless('toms_storage:ts.tag_item_filter', [
        'toms_storage:ts.item_filter',
        'minecraft:redstone',
        'minecraft:name_tag'
    ])

    // ---- redstone / logistics -----------------------------------------------------------------
    // level_emitter — redstone torch + cable + redstone (was comparator).
    event.shaped('toms_storage:ts.level_emitter', [
        ' t ',
        'PLP',
        ' r '
    ], { t: 'minecraft:redstone_torch', P: '#minecraft:planks', L: 'toms_storage:ts.inventory_cable', r: 'minecraft:redstone' })

    // open_crate — planks + chest + stick + trapdoor.
    event.shaped('toms_storage:ts.open_crate', [
        'PSP',
        'PcP',
        'PTP'
    ], { P: '#minecraft:planks', S: 'minecraft:stick', c: '#forge:chests/wooden', T: '#minecraft:trapdoors' })

    // ---- paint / trim -------------------------------------------------------------------------
    // paint_kit — RGB dyes + wool + water bucket.
    event.shaped('toms_storage:ts.paint_kit', [
        'xyz',
        ' w ',
        ' b '
    ], { x: '#forge:dyes/red', y: '#forge:dyes/green', z: '#forge:dyes/blue', w: '#minecraft:wool', b: 'minecraft:water_bucket' })

    // trim (x2) — sticks + chest framed in planks.
    event.shaped(Item.of('toms_storage:ts.trim', 2), [
        'PSP',
        'ScS',
        'PSP'
    ], { P: '#minecraft:planks', S: 'minecraft:stick', c: '#forge:chests/wooden' })

    // trim_clean — wash a painted_trim with a water bucket back into a plain trim (kept from stock).
    event.shapeless('toms_storage:ts.trim', [
        'toms_storage:ts.painted_trim',
        'minecraft:water_bucket'
    ])

    // ---- terminals ----------------------------------------------------------------------------
    // storage_terminal — glass screen around an inventory_connector.
    event.shaped('toms_storage:ts.storage_terminal', [
        'ggg',
        'gIg',
        'ggg'
    ], { g: '#forge:glass', I: 'toms_storage:ts.inventory_connector' })

    // crafting_terminal — crafting tables + planks around a storage_terminal (was diamonds).
    event.shaped('toms_storage:ts.crafting_terminal', [
        'bPb',
        'PMP',
        'bPb'
    ], { b: 'minecraft:crafting_table', P: '#minecraft:planks', M: 'toms_storage:ts.storage_terminal' })

    // wireless_terminal — storage_terminal + spyglass, framed in planks.
    event.shaped('toms_storage:ts.wireless_terminal', [
        ' a ',
        'PMP',
        ' P '
    ], { a: 'minecraft:spyglass', P: '#minecraft:planks', M: 'toms_storage:ts.storage_terminal' })

    // adv_wireless_terminal — diamonds around a wireless_terminal (was netherite smithing upgrade).
    event.shaped('toms_storage:ts.adv_wireless_terminal', [
        ' d ',
        'dWd',
        ' d '
    ], { d: '#forge:gems/diamond', W: 'toms_storage:ts.wireless_terminal' })
})
