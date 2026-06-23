package com.realmgates.installer.hardware;

/**
 * Resolved hardware graphics tier. It drives the AUTO shader pack + preset selection
 * (see {@link OculusConfig}); the user-facing choices live in {@link ShaderPackChoice}
 * and {@link ShaderPresetChoice}.
 */
public enum Tier { OFF, LOW, MEDIUM, HIGH }
