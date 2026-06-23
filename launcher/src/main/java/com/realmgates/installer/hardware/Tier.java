package com.realmgates.installer.hardware;

/** Resolved graphics tier. {@link ShaderChoice} is the user-facing selection (adds AUTO). */
public enum Tier {
    OFF, LOW, MEDIUM, HIGH;

    public enum ShaderChoice {
        AUTO, OFF, LOW, MEDIUM, HIGH;

        public static ShaderChoice from(String s) {
            try { return valueOf(s.trim().toUpperCase()); }
            catch (Exception e) { return AUTO; }
        }
    }
}
