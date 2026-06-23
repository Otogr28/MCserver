// Custom sound events for the modpack (registered both-side so /playsound and StoryKit's `sound` action
// accept them). The audio files live in kubejs/assets/<namespace>/sounds/<name>.ogg and are mapped by
// kubejs/assets/<namespace>/sounds.json. KubeJS serves these as a built-in resource pack (always on — no
// manual resource-pack toggling). No top-level const/global here, so this is safe in KubeJS's shared scope.
StartupEvents.registry('sound_event', event => {
    // Epilogue cinematic theme — referenced by config/storykit/sequences/epilogue.json.
    // Drop the audio at kubejs/assets/summerbuddies/sounds/epilogue_theme.ogg (see the README there).
    event.create('summerbuddies:epilogue_theme')
})
