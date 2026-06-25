// Coins JE (coinsje) — lock coins to admin / quest issuance.
//
// Design (admin request): coins are a CONTROLLED currency. They must NOT be mintable from minerals/ingots,
// and they must NOT drop from mobs or world loot. Money enters the economy ONLY through: mission rewards
// (reward: item with a coinsje coin id), admin /give, and player- or trader-run shops.
//
// Mob/loot drops: Coins JE ships NO loot tables (verified in the jar — no data/coinsje/loot_tables/), so
// nothing drops coins by default and there is nothing to disable on that side.
//
// This removes the only mineral -> coin paths: smelting/blasting an ingot into its coin. Coin <-> coin
// conversions stay intact so the currency is still usable as change:
//   - upgrade   (copper_pile -> iron_coin, iron_pile -> gold_coin, ... via furnace/blasting)
//   - downgrade (iron_coin -> 9 copper_coin, ... via crafting table)
//   - pile stack / deconstruct (9 coins <-> 1 pile)
//   - banner pattern
ServerEvents.recipes((event) => {
  // ingot -> coin minting (matches BOTH the furnace smelting and the blast-furnace blasting variants)
  event.remove({ input: 'minecraft:copper_ingot', output: 'coinsje:copper_coin' })
  event.remove({ input: 'minecraft:iron_ingot',   output: 'coinsje:iron_coin' })
  event.remove({ input: 'minecraft:gold_ingot',   output: 'coinsje:gold_coin' })
})
