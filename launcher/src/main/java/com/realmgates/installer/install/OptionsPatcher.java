package com.realmgates.installer.install;

import com.realmgates.installer.core.Platform;
import com.realmgates.installer.core.ProgressReporter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Unbinds CMDCam's cinematic-camera keys in {@code options.txt} so players don't
 * trigger them by accident. Defaults are letter keys right under the hand
 * (Roll Left = G, Reset Roll = H, Roll Right = J, Zoom = V/B/N, Add Point = P,
 * Start/Stop = U, Clear = Delete) — annoying during normal play.
 *
 * <p>Non-destructive: only the {@code key_*} lines below are touched; every other
 * setting in options.txt (video, audio, other keybinds) is left exactly as-is.
 * Players who want the camera can rebind these in Options &gt; Controls &gt; CMDCam.
 */
public final class OptionsPatcher {

    /** CMDCam KeyMapping ids (the first arg of each {@code new KeyMapping(...)} in the mod). */
    private static final String[] CMDCAM_KEYS = {
            "key.zoomin", "key.centerzoom", "key.zoomout",
            "key.rollleft", "key.rollcenter", "key.rollright",
            "key.point", "key.startStop", "key.clearPoint",
    };

    private static final String UNBOUND = "key.keyboard.unknown";

    private OptionsPatcher() {}

    /** @return number of camera keys that ended up unbound. */
    public static int unbindCameraKeys(Path installDir, ProgressReporter pr) throws IOException {
        Path file = installDir.resolve("options.txt");

        // Which option lines we want to force, as "key_<id>" -> unbound.
        Map<String, Boolean> wanted = new LinkedHashMap<>();
        for (String id : CMDCAM_KEYS) wanted.put("key_" + id, false);

        List<String> out = new ArrayList<>();
        if (Files.exists(file)) {
            for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                int colon = line.indexOf(':');
                String key = colon >= 0 ? line.substring(0, colon) : line;
                if (wanted.containsKey(key)) {
                    out.add(key + ":" + UNBOUND);
                    wanted.put(key, true);
                } else {
                    out.add(line);
                }
            }
        }
        // Append any camera keys that weren't present yet (Minecraft fills the rest with defaults).
        int count = 0;
        for (Map.Entry<String, Boolean> e : wanted.entrySet()) {
            if (!e.getValue()) out.add(e.getKey() + ":" + UNBOUND);
            count++;
        }

        Platform.writeAtomic(file, String.join("\n", out).concat("\n").getBytes(StandardCharsets.UTF_8));
        pr.log("Unbound " + count + " CMDCam camera keys (Roll/Zoom/Point) in options.txt.");
        return count;
    }
}
