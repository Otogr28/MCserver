package com.realmgates.installer.install;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.Platform;
import com.realmgates.installer.core.ProgressReporter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.stream.Stream;

/**
 * Adds/updates a "Realm Gates" profile in {@code .minecraft/launcher_profiles.json}.
 * Both the official Minecraft launcher and SKlauncher read this file, so one entry
 * surfaces the modpack in both.
 */
public final class LauncherProfiles {

    private static final String PROFILE_KEY = "realmgates";
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private LauncherProfiles() {}

    public static void upsert(Path installDir, int xmxGb, ProgressReporter pr) throws IOException {
        Path file = Platform.dotMinecraft().resolve("launcher_profiles.json");

        JsonObject root;
        if (Files.exists(file)) {
            String json = Files.readString(file, StandardCharsets.UTF_8);
            JsonObject parsed = GSON.fromJson(json, JsonObject.class);
            root = (parsed != null) ? parsed : new JsonObject();
        } else {
            root = new JsonObject();
        }
        if (!root.has("profiles") || !root.get("profiles").isJsonObject()) {
            root.add("profiles", new JsonObject());
        }
        if (!root.has("version")) root.addProperty("version", 3);

        JsonObject profiles = root.getAsJsonObject("profiles");
        String now = Instant.now().toString();

        JsonObject existing = profiles.has(PROFILE_KEY) && profiles.get(PROFILE_KEY).isJsonObject()
                ? profiles.getAsJsonObject(PROFILE_KEY) : new JsonObject();

        JsonObject p = new JsonObject();
        p.addProperty("name", "Realm Gates");
        p.addProperty("type", "custom");
        p.addProperty("created", existing.has("created") ? existing.get("created").getAsString() : now);
        p.addProperty("lastUsed", now);
        p.addProperty("gameDir", installDir.toAbsolutePath().toString());
        p.addProperty("lastVersionId", resolveVersionId(pr));
        p.addProperty("javaArgs", "-Xmx" + xmxGb + "G -Xms2G -XX:+UseG1GC");
        if (existing.has("icon")) p.add("icon", existing.get("icon"));

        profiles.add(PROFILE_KEY, p);

        Platform.writeAtomic(file, (GSON.toJson(root) + "\n").getBytes(StandardCharsets.UTF_8));
        pr.log("Launcher profile 'Realm Gates' written (visible in the official launcher and SKlauncher).");
    }

    /** Prefer the exact id; otherwise pick any installed Forge version for this MC version. */
    private static String resolveVersionId(ProgressReporter pr) {
        Path versions = Platform.dotMinecraft().resolve("versions");
        if (Files.isDirectory(versions.resolve(BuildInfo.FORGE_VERSION_ID))) {
            return BuildInfo.FORGE_VERSION_ID;
        }
        try (Stream<Path> s = Files.list(versions)) {
            return s.filter(Files::isDirectory)
                    .map(d -> d.getFileName().toString())
                    .filter(n -> n.contains("forge") && n.contains(BuildInfo.MC_VERSION))
                    .findFirst()
                    .orElse(BuildInfo.FORGE_VERSION_ID);
        } catch (IOException e) {
            return BuildInfo.FORGE_VERSION_ID;
        }
    }
}
