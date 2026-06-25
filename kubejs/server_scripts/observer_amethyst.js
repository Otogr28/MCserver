// Observer sin cuarzo: el server no puede llegar al Nether a por nether quartz, así que
// reemplazamos la receta vanilla del observer por una que usa amatista (amethyst shard,
// obtenible en el overworld) en el mismo slot donde iba el quartz.
//
// Receta vanilla del observer:
//   CCC      C = cobblestone
//   RRQ      R = redstone   Q = nether quartz  <- lo cambiamos por amethyst_shard
//   CCC
//
// Live-reloadable solo desde un COLD START: el (re)inicio del server lee este archivo y aplica el
// cambio. Un /reload vanilla re-dispara el evento de recetas pero NO re-lee un script recién añadido;
// para aplicar sin reinicio completo: `/kubejs reload server_scripts` y luego `/reload`.

ServerEvents.recipes(event => {
    // Quitamos la receta vanilla del observer (la que usa nether quartz)...
    event.remove({ output: 'minecraft:observer' })

    // ...y la re-añadimos idéntica salvo el quartz, ahora amatista.
    event.shaped('minecraft:observer', [
        'CCC',
        'RRA',
        'CCC'
    ], {
        C: 'minecraft:cobblestone',
        R: 'minecraft:redstone',
        A: 'minecraft:amethyst_shard'
    })
})
