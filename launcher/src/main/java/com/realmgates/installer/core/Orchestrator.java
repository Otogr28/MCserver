package com.realmgates.installer.core;

import com.realmgates.installer.hardware.HardwareProbe;
import com.realmgates.installer.hardware.OculusConfig;
import com.realmgates.installer.hardware.ShaderPackChoice;
import com.realmgates.installer.hardware.ShaderPresetChoice;
import com.realmgates.installer.hardware.Tier;
import com.realmgates.installer.hardware.TierClassifier;
import com.realmgates.installer.install.ForgeInstaller;
import com.realmgates.installer.install.LauncherProfiles;
import com.realmgates.installer.install.OptionsPatcher;
import com.realmgates.installer.install.RepoCloner;
import com.realmgates.installer.sync.SyncEngine;

import java.nio.file.Files;
import java.nio.file.Path;

/** Wires the install and sync steps together; called off the UI thread. */
public final class Orchestrator {

    private Orchestrator() {}

    /** Full first-time install. {@code xmxOverrideGb <= 0} means auto-size from RAM. */
    public static void install(Path installDir, ShaderPackChoice packChoice, ShaderPresetChoice presetChoice,
                               boolean keepExtraMods, int xmxOverrideGb, ProgressReporter pr) throws Exception {
        pr.log("=== Installing Realm Gates into " + installDir + " ===");

        // Overlay mode = the target IS a Minecraft launcher root (e.g. TLauncher's single game dir,
        // or .minecraft). There versions/ and libraries/ already live alongside mods/, so we install
        // the modpack on top in place instead of cloning into a fresh, separate game dir.
        boolean overlay = isOverlayTarget(installDir);
        Path launcherRoot = overlay ? installDir : Platform.dotMinecraft();

        if (RepoCloner.isOurClone(installDir)) {
            pr.log("This folder is already a Realm Gates install — refreshing files via sync first.");
            SyncEngine.sync(installDir, keepExtraMods, pr);
        } else if (overlay) {
            pr.log("Target is an existing Minecraft folder (TLauncher / .minecraft) — overlaying the "
                    + "modpack in place; your worlds, options, versions and libraries are kept.");
            RepoCloner.overlayInit(installDir, pr);
            SyncEngine.materializeInitial(installDir, pr);
        } else {
            if (Files.exists(installDir) && Files.isDirectory(installDir)) {
                try (var s = Files.list(installDir)) {
                    if (s.findAny().isPresent())
                        throw new IllegalStateException("Folder is not empty and is not a Realm Gates clone: " + installDir);
                }
            }
            RepoCloner.clone(installDir, pr);
        }

        HardwareProbe.Info hw = HardwareProbe.probe();
        pr.log("Detected hardware: " + hw);
        Tier tier = TierClassifier.classify(hw);

        if (!ForgeInstaller.installTo(launcherRoot, pr)) {
            pr.log("Forge install did not complete cleanly — open your launcher and select Forge "
                    + BuildInfo.FORGE_VERSION_ID + " manually if the profile is missing.");
        }

        int xmx = (xmxOverrideGb > 0) ? xmxOverrideGb : OculusConfig.recommendedXmxGb(hw.ramGb());
        LauncherProfiles.upsert(launcherRoot, installDir, xmx, pr);
        pr.log("Allocated -Xmx" + xmx + "G (of " + hw.ramGb() + " GB system RAM).");

        pr.log("Shader config: " + OculusConfig.apply(installDir, packChoice, presetChoice, tier));
        OptionsPatcher.unbindCameraKeys(installDir, pr);

        pr.progress(100);
        pr.log(overlay
                ? "=== Install complete. Open TLauncher (or the official launcher), pick the Forge "
                        + BuildInfo.FORGE_VERSION_ID + " version, and play. ==="
                : "=== Install complete. Open the official Minecraft launcher or SKlauncher, "
                        + "pick the 'Realm Gates' profile, and play. ===");
    }

    /**
     * Is {@code installDir} an existing Minecraft launcher root we should overlay onto (rather than
     * clone a fresh, separate game dir into)? True when it already looks like one, or when it is
     * literally {@code .minecraft} / TLauncher's configured game dir (covers an as-yet-empty one).
     */
    private static boolean isOverlayTarget(Path installDir) {
        if (RepoCloner.looksLikeMinecraftDir(installDir)) return true;
        if (sameDir(installDir, Platform.dotMinecraft())) return true;
        return Platform.hasTLauncher() && sameDir(installDir, Platform.tlauncherGameDir());
    }

    private static boolean sameDir(Path a, Path b) {
        if (a == null || b == null) return false;
        try {
            return a.toAbsolutePath().normalize().equals(b.toAbsolutePath().normalize());
        } catch (RuntimeException e) {
            return false;
        }
    }

    /** Selective update (preserves shader/personal configs). */
    public static void sync(Path installDir, boolean keepExtraMods, ProgressReporter pr) throws Exception {
        if (!RepoCloner.isOurClone(installDir))
            throw new IllegalStateException("Not a Realm Gates install: " + installDir + " — use Install first.");
        pr.log("=== Syncing Realm Gates in " + installDir + " ===");
        SyncEngine.sync(installDir, keepExtraMods, pr);
    }

    /** Standalone helper for the "Unbind camera keys" button (existing installs). */
    public static void unbindCameraKeys(Path installDir, ProgressReporter pr) throws Exception {
        OptionsPatcher.unbindCameraKeys(installDir, pr);
        pr.log("Done. (Re)launch Minecraft for it to take effect.");
    }
}
