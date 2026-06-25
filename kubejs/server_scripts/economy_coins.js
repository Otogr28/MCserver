// Lightman's Currency — lock coins to admin / quest issuance.
//
// Design (admin request): coins are UNIQUE and must NOT be craftable from other items. The only coin
// "crafting" allowed is coin <-> coin: the built-in TIER CONVERSION (right-click to step copper -> iron ->
// gold -> emerald -> diamond -> netherite) and the pile/block compacting recipes. Money enters the economy
// ONLY through: admin commands (/lcadmin, /lc money give), mission rewards (reward: item with a coin id),
// and player- or trader-run shops.
//
// This removes the two item -> coin paths:
//   1) the Coin Minting Machine block recipe  (so players can't build a mint)
//   2) every ingot -> coin mint recipe         (type lightmanscurrency:coin_mint)
//
// NOTE: also set these in config/lightmanscurrency/common.toml after first server run (the clean way, and
// it kills the chest-loot leak this script can't touch):
//   crafting.coin_mint.canCraftCoinMint = false
//   crafting.coin_mint.canMint          = false
//   + disable the "coins in chests" loot (LC loot config) so coins never spawn in world chests.
ServerEvents.recipes((event) => {
  event.remove({ output: 'lightmanscurrency:coinmint' }) // can't build a Coin Minting Machine
  event.remove({ type: 'lightmanscurrency:coin_mint' })  // can't mint ingots -> coins
})
