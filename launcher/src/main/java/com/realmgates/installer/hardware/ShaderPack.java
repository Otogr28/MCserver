package com.realmgates.installer.hardware;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

/** A shader pack the installer can enable, plus how to locate its zip in {@code shaderpacks/}. */
public enum ShaderPack {
    COMPLEMENTARY("Complementary", "ComplementaryUnbound", "ComplementaryUnbound_r5.8.1.zip"),
    SOLAS("Solas", "Solas Shader", "Solas Shader V3.6.zip");

    public final String displayName;
    private final String filePrefix;   // matches the zip across version bumps
    private final String fallbackZip;  // pinned name used when nothing matches the prefix

    ShaderPack(String displayName, String filePrefix, String fallbackZip) {
        this.displayName = displayName;
        this.filePrefix = filePrefix;
        this.fallbackZip = fallbackZip;
    }

    /**
     * The actual zip file name for this pack inside {@code shaderpacksDir}: the highest-sorting file
     * whose name starts with {@link #filePrefix} and ends in {@code .zip} (so a version bump is picked
     * up automatically); falls back to the pinned name when the dir can't be read or has no match.
     */
    public String zipName(Path shaderpacksDir) {
        try (Stream<Path> s = Files.list(shaderpacksDir)) {
            return s.filter(Files::isRegularFile)
                    .map(p -> p.getFileName().toString())
                    .filter(n -> n.startsWith(filePrefix) && n.toLowerCase().endsWith(".zip"))
                    .max(Comparator.naturalOrder())
                    .orElse(fallbackZip);
        } catch (IOException e) {
            return fallbackZip;
        }
    }

    @Override public String toString() { return displayName; }
}
