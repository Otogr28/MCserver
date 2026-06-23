package com.realmgates.installer.hardware;

import oshi.SystemInfo;
import oshi.hardware.GraphicsCard;
import oshi.hardware.HardwareAbstractionLayer;

import java.util.List;

/** Reads RAM, CPU cores and the main GPU (name + VRAM) via oshi. */
public final class HardwareProbe {

    /** Immutable snapshot of the detected hardware. */
    public record Info(long ramBytes, int cores, String gpuName, long vramBytes) {
        public long ramGb()  { return Math.round(ramBytes  / (1024.0 * 1024 * 1024)); }
        public long vramGb() { return Math.round(vramBytes / (1024.0 * 1024 * 1024)); }
        public boolean vramKnown() { return vramBytes > 0; }

        @Override public String toString() {
            return String.format("%s | VRAM %s | RAM %d GB | %d cores",
                    gpuName == null ? "unknown GPU" : gpuName,
                    vramKnown() ? (vramGb() + " GB") : "unknown",
                    ramGb(), cores);
        }
    }

    private HardwareProbe() {}

    public static Info probe() {
        try {
            SystemInfo si = new SystemInfo();
            HardwareAbstractionLayer hal = si.getHardware();
            long ram = hal.getMemory().getTotal();
            int cores = hal.getProcessor().getLogicalProcessorCount();
            GraphicsCard gpu = pickMainGpu(hal.getGraphicsCards());
            String name = gpu == null ? null : gpu.getName();
            long vram = gpu == null ? 0 : gpu.getVRam();
            return new Info(ram, cores, name, vram);
        } catch (Throwable t) {
            // Never let probing crash the install; fall back to a conservative profile.
            return new Info(0, Runtime.getRuntime().availableProcessors(), null, 0);
        }
    }

    /** Prefer the dedicated card: most VRAM, de-prioritising integrated/software renderers. */
    private static GraphicsCard pickMainGpu(List<GraphicsCard> cards) {
        if (cards == null || cards.isEmpty()) return null;
        GraphicsCard best = null;
        long bestScore = Long.MIN_VALUE;
        for (GraphicsCard c : cards) {
            long score = c.getVRam();
            String n = c.getName() == null ? "" : c.getName().toLowerCase();
            boolean integrated = n.contains("intel") || n.contains("microsoft basic")
                    || n.contains("llvmpipe") || n.contains("software");
            if (integrated) score -= (4L << 30); // demote integrated when a dedicated card exists
            if (score > bestScore) { bestScore = score; best = c; }
        }
        return best;
    }
}
