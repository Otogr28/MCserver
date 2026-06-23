package com.realmgates.installer.core;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Properties;

/**
 * OS detection and the platform-specific paths the installer needs:
 * the launcher's {@code .minecraft} directory, our app-state directory,
 * and the {@code java} binary bundled with this app (jpackage runtime).
 */
public final class Platform {

    public enum Os { WINDOWS, MAC, LINUX }

    public static final Os OS = detect();

    private Platform() {}

    private static Os detect() {
        String n = System.getProperty("os.name", "").toLowerCase();
        if (n.contains("win")) return Os.WINDOWS;
        if (n.contains("mac") || n.contains("darwin")) return Os.MAC;
        return Os.LINUX;
    }

    public static boolean isWindows() { return OS == Os.WINDOWS; }
    public static boolean isMac()     { return OS == Os.MAC; }

    private static Path home() {
        return Path.of(System.getProperty("user.home"));
    }

    /** The shared {@code .minecraft} directory read by both the official launcher and SKlauncher. */
    public static Path dotMinecraft() {
        switch (OS) {
            case WINDOWS:
                String appData = System.getenv("APPDATA");
                Path base = (appData != null && !appData.isBlank())
                        ? Path.of(appData) : home().resolve("AppData").resolve("Roaming");
                return base.resolve(".minecraft");
            case MAC:
                return home().resolve("Library").resolve("Application Support").resolve("minecraft");
            default:
                return home().resolve(".minecraft");
        }
    }

    /**
     * TLauncher's config directory ({@code .tlauncher}). Windows puts it under {@code %APPDATA%};
     * macOS and Linux use {@code ~/.tlauncher}.
     */
    public static Path tlauncherDir() {
        if (OS == Os.WINDOWS) {
            String appData = System.getenv("APPDATA");
            Path base = (appData != null && !appData.isBlank())
                    ? Path.of(appData) : home().resolve("AppData").resolve("Roaming");
            return base.resolve(".tlauncher");
        }
        return home().resolve(".tlauncher");
    }

    /** True when TLauncher appears to be installed for this user. */
    public static boolean hasTLauncher() {
        return Files.isDirectory(tlauncherDir());
    }

    /**
     * TLauncher's single Minecraft directory ({@code minecraft.gamedir} in
     * {@code tlauncher-2.0.properties}). TLauncher uses one game dir for everything
     * (versions, libraries, mods), so this is where the modpack must live for it to load.
     * Falls back to {@link #dotMinecraft()} when not configured.
     */
    public static Path tlauncherGameDir() {
        Path props = tlauncherDir().resolve("tlauncher-2.0.properties");
        if (Files.isRegularFile(props)) {
            Properties p = new Properties();
            try (InputStream in = Files.newInputStream(props)) {
                p.load(in); // ISO-8859-1 + unescaping handled by Properties (file stores C\:\\Users\\…)
            } catch (IOException ignored) {}
            String v = p.getProperty("minecraft.gamedir");
            if (v != null && !v.isBlank()) {
                try { return Path.of(v.strip()); } catch (RuntimeException ignored) {}
            }
        }
        return dotMinecraft();
    }

    /** Where we persist the installer's own state (NOT inside the game dir, so a wipe keeps it). */
    public static Path appStateDir() {
        switch (OS) {
            case WINDOWS:
                String appData = System.getenv("APPDATA");
                Path base = (appData != null && !appData.isBlank())
                        ? Path.of(appData) : home().resolve("AppData").resolve("Roaming");
                return base.resolve("RealmGatesInstaller");
            case MAC:
                return home().resolve("Library").resolve("Application Support").resolve("RealmGatesInstaller");
            default:
                String xdg = System.getenv("XDG_CONFIG_HOME");
                Path cfg = (xdg != null && !xdg.isBlank()) ? Path.of(xdg) : home().resolve(".config");
                return cfg.resolve("realmgates-installer");
        }
    }

    /** Default install directory suggested in the UI. */
    public static Path defaultInstallDir() {
        return home().resolve("RealmGates");
    }

    /**
     * The {@code java} executable of the runtime this app runs on. Under a jpackage
     * bundle this resolves to the EMBEDDED runtime, so a player with no system Java
     * can still run the Forge installer jar through it.
     */
    public static Path javaExecutable() {
        Path bin = Path.of(System.getProperty("java.home")).resolve("bin");
        return bin.resolve(isWindows() ? "java.exe" : "java");
    }

    /** Write bytes atomically: temp file in the same dir, then move into place. */
    public static void writeAtomic(Path target, byte[] data) throws IOException {
        Path parent = target.toAbsolutePath().getParent();
        Files.createDirectories(parent);
        Path tmp = Files.createTempFile(parent, ".rg-", ".tmp");
        try {
            Files.write(tmp, data);
            try {
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException atomicUnsupported) {
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(tmp);
        }
    }
}
