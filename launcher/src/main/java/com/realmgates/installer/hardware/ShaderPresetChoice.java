package com.realmgates.installer.hardware;

/**
 * User-facing shader quality preset. Each non-AUTO value maps to a {@code profile.<NAME>} defined in
 * the pack's {@code shaders/shaders.properties} (LOW/MEDIUM/HIGH/ULTRA exist in both Complementary and
 * Solas). {@code AUTO} derives the preset from the hardware tier (see {@link OculusConfig}).
 */
public enum ShaderPresetChoice {
    AUTO("Auto (by hardware)"),
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High"),
    ULTRA("Ultra");

    private final String label;

    ShaderPresetChoice(String label) { this.label = label; }

    public static ShaderPresetChoice from(String s) {
        try { return valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { return AUTO; }
    }

    @Override public String toString() { return label; }
}
