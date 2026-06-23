package com.realmgates.installer.install;

import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.Platform;
import com.realmgates.installer.core.ProgressReporter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Installs Forge headlessly via the official installer jar, run through the JRE this app
 * is bundled with (so the player needs no system Java).
 */
public final class ForgeInstaller {

    private ForgeInstaller() {}

    /** @return true if the expected versions/&lt;id&gt; directory exists after install. */
    public static boolean install(ProgressReporter pr) throws Exception {
        Path dotMc = Platform.dotMinecraft();
        Path versionDir = dotMc.resolve("versions").resolve(BuildInfo.FORGE_VERSION_ID);

        if (Files.isDirectory(versionDir)) {
            pr.log("Forge " + BuildInfo.FORGE_VERSION_ID + " already installed — skipping.");
            return true;
        }

        // The Forge installer requires a writable .minecraft with a launcher_profiles.json.
        Files.createDirectories(dotMc.resolve("versions"));
        Path profiles = dotMc.resolve("launcher_profiles.json");
        if (!Files.exists(profiles)) {
            pr.log("Seeding a minimal launcher_profiles.json (required by the Forge installer).");
            Platform.writeAtomic(profiles,
                    "{\n  \"profiles\": {},\n  \"settings\": { \"enableSnapshots\": false },\n  \"version\": 3\n}\n"
                            .getBytes(StandardCharsets.UTF_8));
        }

        Path installerJar = Files.createTempFile("forge-installer-", ".jar");
        try {
            Downloader.download(BuildInfo.FORGE_INSTALLER_URL, installerJar, pr);

            String java = Platform.javaExecutable().toString();
            pr.log("Running Forge installer with " + java);
            ProcessBuilder pb = new ProcessBuilder(
                    java, "-jar", installerJar.toString(),
                    "--installClient", dotMc.toString())
                    .redirectErrorStream(true);
            Process proc = pb.start();
            try (BufferedReader r = new BufferedReader(
                    new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) pr.log("[forge] " + line);
            }
            int code = proc.waitFor();
            pr.log("Forge installer exited with code " + code);
            if (code != 0) throw new IOException("Forge installer failed (exit " + code + ")");
        } finally {
            Files.deleteIfExists(installerJar);
        }

        boolean ok = Files.isDirectory(versionDir);
        if (!ok) pr.log("WARNING: expected " + versionDir + " was not created.");
        return ok;
    }
}
