package com.realmgates.installer.core;

import com.realmgates.installer.hardware.HardwareProbe;
import com.realmgates.installer.hardware.OculusConfig;
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
    public static void install(Path installDir, Tier.ShaderChoice choice, boolean keepExtraMods,
                               int xmxOverrideGb, ProgressReporter pr) throws Exception {
        pr.log("=== Installing Realm Gates into " + installDir + " ===");

        if (RepoCloner.isOurClone(installDir)) {
            pr.log("This folder is already a Realm Gates clone — refreshing files via sync first.");
            SyncEngine.sync(installDir, keepExtraMods, pr);
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
        Tier tier = (choice == Tier.ShaderChoice.AUTO)
                ? TierClassifier.classify(hw)
                : Tier.valueOf(choice.name());

        if (!ForgeInstaller.install(pr)) {
            pr.log("Forge install did not complete cleanly — open your launcher and select Forge "
                    + BuildInfo.FORGE_VERSION_ID + " manually if the profile is missing.");
        }

        int xmx = (xmxOverrideGb > 0) ? xmxOverrideGb : OculusConfig.recommendedXmxGb(hw.ramGb());
        LauncherProfiles.upsert(installDir, xmx, pr);
        pr.log("Allocated -Xmx" + xmx + "G (of " + hw.ramGb() + " GB system RAM).");

        pr.log("Shader config: " + OculusConfig.apply(installDir, tier));
        OptionsPatcher.unbindCameraKeys(installDir, pr);

        pr.progress(100);
        pr.log("=== Install complete. Open the official Minecraft launcher or SKlauncher, "
                + "pick the 'Realm Gates' profile, and play. ===");
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
