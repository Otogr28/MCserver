package com.realmgates.installer.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Small persisted state for the installer (install dir, shader choice, flags). */
public final class AppState {

    public String installDir = "";
    public String shaderChoice = "AUTO";   // AUTO/OFF/LOW/MEDIUM/HIGH
    public boolean keepExtraMods = false;
    public boolean xmxLocked = false;
    public int xmxGb = 0;                   // 0 = auto from RAM

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    public static Path file() {
        return Platform.appStateDir().resolve("state.json");
    }

    public static AppState load() {
        try {
            Path f = file();
            if (Files.exists(f)) {
                String json = Files.readString(f, StandardCharsets.UTF_8);
                AppState s = GSON.fromJson(json, AppState.class);
                if (s != null) return s;
            }
        } catch (Exception ignored) {}
        AppState s = new AppState();
        s.installDir = Platform.defaultInstallDir().toString();
        return s;
    }

    public void save() {
        try {
            Path f = file();
            Files.createDirectories(f.getParent());
            Platform.writeAtomic(f, GSON.toJson(this).getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {}
    }
}
