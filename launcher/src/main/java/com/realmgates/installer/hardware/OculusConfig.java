package com.realmgates.installer.hardware;

import com.realmgates.installer.core.Platform;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Writes the shader choice into {@code config/oculus.properties}, touching only the
 * {@code enableShaders} and {@code shaderPack} keys (every other key/comment is preserved).
 */
public final class OculusConfig {

    public static final String SOLAS = "Solas Shader V3.6.zip";
    public static final String COMPLEMENTARY = "ComplementaryUnbound_r5.8.1.zip";

    private OculusConfig() {}

    /** @return a short human-readable summary of what was applied. */
    public static String apply(Path installDir, Tier tier) throws IOException {
        boolean enable = (tier == Tier.HIGH || tier == Tier.MEDIUM);
        String pack = switch (tier) {
            case HIGH -> SOLAS;
            case MEDIUM -> COMPLEMENTARY;
            default -> null; // leave shaderPack as-is when shaders are off
        };

        Path file = installDir.resolve("config").resolve("oculus.properties");
        List<String> lines = Files.exists(file)
                ? new ArrayList<>(Files.readAllLines(file, StandardCharsets.UTF_8))
                : new ArrayList<>();

        boolean sawEnable = false, sawPack = false;
        for (int i = 0; i < lines.size(); i++) {
            String l = lines.get(i);
            String trimmed = l.stripLeading();
            if (trimmed.startsWith("enableShaders=")) {
                lines.set(i, "enableShaders=" + enable);
                sawEnable = true;
            } else if (trimmed.startsWith("shaderPack=") && pack != null) {
                lines.set(i, "shaderPack=" + pack);
                sawPack = true;
            }
        }
        if (!sawEnable) lines.add("enableShaders=" + enable);
        if (pack != null && !sawPack) lines.add("shaderPack=" + pack);

        Platform.writeAtomic(file, String.join("\n", lines).concat("\n").getBytes(StandardCharsets.UTF_8));

        return enable
                ? "shaders ON (" + (pack == null ? "" : pack) + ") — tier " + tier
                : "shaders OFF — tier " + tier;
    }

    /** Recommended -Xmx in GB for the launcher profile, derived from system RAM. */
    public static int recommendedXmxGb(long ramGb) {
        long half = Math.round(ramGb / 2.0);
        return (int) Math.max(4, Math.min(8, half));
    }
}
