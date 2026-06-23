package com.realmgates.installer.hardware;

import com.realmgates.installer.core.Platform;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * Applies a shader quality "profile" (preset: LOW/MEDIUM/HIGH/ULTRA) the way Iris/Oculus does internally.
 *
 * <p>Iris does NOT persist a {@code profile=NAME} line. It derives the active profile by scanning the
 * per-pack settings file ({@code shaderpacks/<pack>.zip.txt}) and matching the stored option values
 * against each {@code profile.*} definition in the pack's {@code shaders/shaders.properties}
 * (see {@code ProfileSet.scan} / {@code Profile.matches} in Iris). So to "set a preset" we resolve the
 * requested profile to its expanded option values — chasing {@code profile.X} references, honouring
 * {@code !OPTION} (off), bare {@code OPTION} (on) and {@code KEY=VALUE} — and write exactly those into
 * the settings file. Iris then both renders at that quality and shows the profile name in its GUI.
 */
public final class ShaderProfiles {

    private static final String SHADERS_PROPERTIES = "shaders/shaders.properties";

    private ShaderProfiles() {}

    /**
     * Resolve {@code profileName} inside {@code shaderpacks/<zipName>} and write its option values to
     * {@code shaderpacks/<zipName>.txt}, replacing any previous option overrides.
     *
     * @return {@code true} when the profile was found and applied; {@code false} when the zip,
     *         its {@code shaders.properties}, or the named profile is missing (caller leaves the pack
     *         at its built-in defaults).
     */
    public static boolean applyPreset(Path shaderpacksDir, String zipName, String profileName)
            throws IOException {
        Path zip = shaderpacksDir.resolve(zipName);
        if (!Files.isRegularFile(zip)) return false;

        Map<String, String> props = readShadersProperties(zip);
        if (props.isEmpty()) return false;

        Map<String, String> resolved = new LinkedHashMap<>();
        if (!resolveProfile(profileName, props, resolved, new ArrayList<>()) || resolved.isEmpty())
            return false;

        StringBuilder sb = new StringBuilder("#Realm Gates installer — preset ").append(profileName).append('\n');
        for (Map.Entry<String, String> e : resolved.entrySet()) {
            sb.append(e.getKey()).append('=').append(e.getValue()).append('\n');
        }
        Path settings = shaderpacksDir.resolve(zipName + ".txt");
        Platform.writeAtomic(settings, sb.toString().getBytes(StandardCharsets.UTF_8));
        return true;
    }

    /**
     * Recursively expand {@code profile.<name>} into option-&gt;value, processing tokens left-to-right
     * so later tokens (and the requesting profile's own overrides) win over inherited ones.
     */
    private static boolean resolveProfile(String name, Map<String, String> props,
                                          Map<String, String> out, List<String> visiting) {
        if (visiting.contains(name)) return true; // guard against cyclic / repeated references
        String def = props.get("profile." + name);
        if (def == null) return false;
        visiting.add(name);
        for (String tok : def.trim().split("\\s+")) {
            if (tok.isEmpty()) continue;
            if (tok.startsWith("profile.")) {
                resolveProfile(tok.substring("profile.".length()), props, out, visiting);
            } else if (tok.startsWith("!")) {
                out.put(tok.substring(1), "false");
            } else {
                int eq = tok.indexOf('=');
                if (eq >= 0) out.put(tok.substring(0, eq), tok.substring(eq + 1));
                else out.put(tok, "true");
            }
        }
        visiting.remove(name);
        return true;
    }

    /** Read {@code shaders/shaders.properties} from the zip into key-&gt;value (comments/blank skipped). */
    private static Map<String, String> readShadersProperties(Path zip) throws IOException {
        Map<String, String> map = new LinkedHashMap<>();
        try (ZipFile zf = new ZipFile(zip.toFile())) {
            ZipEntry e = zf.getEntry(SHADERS_PROPERTIES);
            if (e == null) return map;
            try (InputStream in = zf.getInputStream(e)) {
                String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                for (String raw : text.split("\\r?\\n")) {
                    String line = raw.strip();
                    if (line.isEmpty() || line.startsWith("#")) continue;
                    int eq = line.indexOf('=');
                    if (eq < 0) continue;
                    map.put(line.substring(0, eq).strip(), line.substring(eq + 1).strip());
                }
            }
        }
        return map;
    }
}
