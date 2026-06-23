package com.realmgates.installer.hardware;

/**
 * User-facing shader-pack selection in the installer UI. {@code AUTO} lets the hardware tier
 * decide (see {@link OculusConfig}); the rest force a specific pack (or none).
 */
public enum ShaderPackChoice {
    AUTO("Auto (by hardware)"),
    OFF("Off (no shaders)"),
    COMPLEMENTARY("Complementary"),
    SOLAS("Solas");

    private final String label;

    ShaderPackChoice(String label) { this.label = label; }

    public static ShaderPackChoice from(String s) {
        try { return valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { return AUTO; }
    }

    @Override public String toString() { return label; }
}
