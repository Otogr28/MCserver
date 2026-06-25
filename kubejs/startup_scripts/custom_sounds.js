// Custom sound events for the modpack (registered both-side so /playsound and StoryKit's `sound` action
// accept them). The audio files live in kubejs/assets/<namespace>/sounds/<name>.ogg and are mapped by
// kubejs/assets/<namespace>/sounds.json. KubeJS serves these as a built-in resource pack (always on — no
// manual resource-pack toggling). No top-level const/global here, so this is safe in KubeJS's shared scope.
StartupEvents.registry('sound_event', event => {
    // Cinematic themes — referenced by config/storykit/sequences/*.json (StoryKit `music` action).
    // Audio at kubejs/assets/summerbuddies/sounds/<name>.ogg, mapped with stream:true in sounds.json
    // (stream:true is REQUIRED or Minecraft truncates long music to a few seconds).
    event.create('summerbuddies:epilogue_theme')
    event.create('summerbuddies:chapter11_theme')
    event.create('summerbuddies:chapter12_theme')
})
