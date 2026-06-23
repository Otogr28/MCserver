package com.realmgates.installer.hardware;

import com.realmgates.installer.hardware.HardwareProbe.Info;

/**
 * Maps detected hardware to a shader {@link Tier}. The thresholds below are a
 * starting heuristic — tune them freely; they are intentionally simple constants.
 */
public final class TierClassifier {

    // HIGH: dedicated-GPU class machine (the admin's PC lands here -> Solas on).
    private static final long HIGH_VRAM_GB = 6, HIGH_RAM_GB = 16; private static final int HIGH_CORES = 8;
    // MEDIUM: mid GPU.
    private static final long MED_VRAM_GB  = 4, MED_RAM_GB  = 12; private static final int MED_CORES  = 6;
    // LOW: integrated/weak GPU but enough RAM to play without shaders.
    private static final long LOW_RAM_GB   = 8;

    private TierClassifier() {}

    public static Tier classify(Info hw) {
        long ram = hw.ramGb();
        int cores = hw.cores();

        // When VRAM is readable we can trust the GPU tiers. When it's unknown
        // (some drivers report 0), lean on RAM+cores and stay conservative.
        if (hw.vramKnown()) {
            long vram = hw.vramGb();
            if (vram >= HIGH_VRAM_GB && ram >= HIGH_RAM_GB && cores >= HIGH_CORES) return Tier.HIGH;
            if (vram >= MED_VRAM_GB  && ram >= MED_RAM_GB  && cores >= MED_CORES)  return Tier.MEDIUM;
            if (ram >= LOW_RAM_GB) return Tier.LOW;
            return Tier.OFF;
        }

        if (ram >= HIGH_RAM_GB && cores >= HIGH_CORES) return Tier.MEDIUM; // unknown GPU -> cap at MEDIUM
        if (ram >= LOW_RAM_GB) return Tier.LOW;
        return Tier.OFF;
    }
}
