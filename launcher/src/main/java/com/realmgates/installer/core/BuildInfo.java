package com.realmgates.installer.core;

import java.io.InputStream;
import java.util.Properties;

/** Modpack coordinates baked in at build time (see {@code generateBuildInfo} in build.gradle). */
public final class BuildInfo {

    public static final String APP_NAME;
    public static final String APP_VERSION;
    public static final String MC_VERSION;
    public static final String FORGE_VERSION;
    public static final String REPO_URL;
    public static final String REPO_BRANCH;

    /** The Forge version id as it appears under {@code .minecraft/versions/} and in profiles. */
    public static final String FORGE_VERSION_ID;
    public static final String FORGE_INSTALLER_URL;

    static {
        Properties p = new Properties();
        try (InputStream in = BuildInfo.class.getResourceAsStream("/com/realmgates/installer/build.properties")) {
            if (in != null) p.load(in);
        } catch (Exception ignored) {}

        APP_NAME      = p.getProperty("appName", "Realm Gates Installer");
        APP_VERSION   = p.getProperty("appVersion", "1.0.0");
        MC_VERSION    = p.getProperty("mcVersion", "1.20.1");
        FORGE_VERSION = p.getProperty("forgeVersion", "47.4.0");
        REPO_URL      = p.getProperty("repoUrl", "https://github.com/Otogr28/MCserver.git");
        REPO_BRANCH   = p.getProperty("repoBranch", "master");

        FORGE_VERSION_ID = MC_VERSION + "-forge-" + FORGE_VERSION;
        FORGE_INSTALLER_URL = "https://maven.minecraftforge.net/net/minecraftforge/forge/"
                + MC_VERSION + "-" + FORGE_VERSION + "/forge-"
                + MC_VERSION + "-" + FORGE_VERSION + "-installer.jar";
    }

    private BuildInfo() {}
}
