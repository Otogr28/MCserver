package com.realmgates.installer.hardware;

import com.realmgates.installer.core.Platform;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Decides which shader pack to enable and at what quality preset, then writes that decision out:
 * the {@code enableShaders}/{@code shaderPack} keys in {@code config/oculus.properties} (every other
 * key/comment preserved) plus, when shaders are on, the preset's option values into the pack's
 * settings file (via {@link ShaderProfiles}).
 *
 * <p>AUTO resolution (when the user leaves a dropdown on AUTO), keyed off the detected hardware tier:
 * <pre>
 *   pack:    HIGH -&gt; Solas        | MEDIUM, LOW -&gt; Complementary | OFF -&gt; none
 *   preset:  HIGH -&gt; HIGH         | MEDIUM -&gt; MEDIUM             | LOW, OFF -&gt; LOW
 * </pre>
 */
public final class OculusConfig {

    private OculusConfig() {}

    /** @return a short human-readable summary of what was applied. */
    public static String apply(Path installDir, ShaderPackChoice packChoice,
                               ShaderPresetChoice presetChoice, Tier hwTier) throws IOException {
        ShaderPack pack = resolvePack(packChoice, hwTier);    // null = shaders off
        boolean enable = pack != null;

        Path shaderpacksDir = installDir.resolve("shaderpacks");
        String zipName = enable ? pack.zipName(shaderpacksDir) : null;

        writeOculusProperties(installDir, enable, zipName);
        if (!enable) return "shaders OFF — tier " + hwTier;

        String preset = resolvePreset(presetChoice, hwTier);  // LOW/MEDIUM/HIGH/ULTRA
        String summary = "shaders ON — " + pack.displayName + " @ " + preset + " (" + zipName + ")";
        try {
            if (!ShaderProfiles.applyPreset(shaderpacksDir, zipName, preset))
                summary += " [preset not found in pack; left at its built-in default]";
        } catch (IOException e) {
            summary += " [could not write preset: " + e.getMessage() + "]";
        }
        return summary;
    }

    /** Force a pack, or pick one from the tier when AUTO. {@code null} = no shaders. */
    private static ShaderPack resolvePack(ShaderPackChoice choice, Tier hwTier) {
        return switch (choice) {
            case OFF -> null;
            case COMPLEMENTARY -> ShaderPack.COMPLEMENTARY;
            case SOLAS -> ShaderPack.SOLAS;
            case AUTO -> switch (hwTier) {
                case HIGH -> ShaderPack.SOLAS;
                case MEDIUM, LOW -> ShaderPack.COMPLEMENTARY;
                case OFF -> null;
            };
        };
    }

    /** Force a preset name, or derive it from the tier when AUTO. */
    private static String resolvePreset(ShaderPresetChoice choice, Tier hwTier) {
        if (choice != ShaderPresetChoice.AUTO) return choice.name();
        return switch (hwTier) {
            case HIGH -> "HIGH";
            case MEDIUM -> "MEDIUM";
            case LOW, OFF -> "LOW";
        };
    }

    /** Touch only {@code enableShaders} and {@code shaderPack}; preserve every other key and comment. */
    private static void writeOculusProperties(Path installDir, boolean enable, String zipName)
            throws IOException {
        Path file = installDir.resolve("config").resolve("oculus.properties");
        List<String> lines = Files.exists(file)
                ? new ArrayList<>(Files.readAllLines(file, StandardCharsets.UTF_8))
                : new ArrayList<>();

        boolean sawEnable = false, sawPack = false;
        for (int i = 0; i < lines.size(); i++) {
            String trimmed = lines.get(i).stripLeading();
            if (trimmed.startsWith("enableShaders=")) {
                lines.set(i, "enableShaders=" + enable);
                sawEnable = true;
            } else if (trimmed.startsWith("shaderPack=") && zipName != null) {
                lines.set(i, "shaderPack=" + zipName);
                sawPack = true;
            }
        }
        if (!sawEnable) lines.add("enableShaders=" + enable);
        if (zipName != null && !sawPack) lines.add("shaderPack=" + zipName);

        Platform.writeAtomic(file, String.join("\n", lines).concat("\n").getBytes(StandardCharsets.UTF_8));
    }

    /** Recommended -Xmx in GB for the launcher profile, derived from system RAM. */
    public static int recommendedXmxGb(long ramGb) {
        long half = Math.round(ramGb / 2.0);
        return (int) Math.max(4, Math.min(8, half));
    }
}
