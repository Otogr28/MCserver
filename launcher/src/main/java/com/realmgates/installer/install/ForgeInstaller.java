package com.realmgates.installer.install;

import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.Platform;
import com.realmgates.installer.core.ProgressReporter;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Permission;
import java.util.jar.JarFile;
import java.util.jar.Manifest;

/**
 * Installs Forge headlessly by running the official installer jar IN-PROCESS.
 *
 * <p>We cannot spawn {@code java}: the JRE that jpackage bundles with this app strips the
 * {@code java}/{@code java.exe} launcher (only the JVM DLLs remain), so there is no java
 * binary to exec. Instead we load the installer jar in a child classloader, call its
 * {@code main(--installClient <dir>)}, and trap the {@code System.exit} it calls at the end.
 */
public final class ForgeInstaller {

    private static final String FALLBACK_MAIN = "net.minecraftforge.installer.SimpleInstaller";

    private ForgeInstaller() {}

    public static boolean install(ProgressReporter pr) throws Exception {
        return installTo(Platform.dotMinecraft(), pr);
    }

    /** @return true if {@code versions/<FORGE_VERSION_ID>} exists after installing. */
    public static boolean installTo(Path dotMc, ProgressReporter pr) throws Exception {
        Path versionDir = dotMc.resolve("versions").resolve(BuildInfo.FORGE_VERSION_ID);
        if (Files.isDirectory(versionDir)) {
            pr.log("Forge " + BuildInfo.FORGE_VERSION_ID + " already installed — skipping.");
            return true;
        }

        // The Forge installer requires a writable .minecraft with a launcher_profiles.json.
        Files.createDirectories(dotMc.resolve("versions"));
        Path profiles = dotMc.resolve("launcher_profiles.json");
        if (!Files.exists(profiles)) {
            pr.log("Seeding a minimal launcher_profiles.json (required by the Forge installer).");
            Platform.writeAtomic(profiles,
                    "{\n  \"profiles\": {},\n  \"settings\": { \"enableSnapshots\": false },\n  \"version\": 3\n}\n"
                            .getBytes(StandardCharsets.UTF_8));
        }

        Path installerJar = Files.createTempFile("forge-installer-", ".jar");
        try {
            Downloader.download(BuildInfo.FORGE_INSTALLER_URL, installerJar, pr);
            runInProcess(installerJar, dotMc, pr);
        } finally {
            Files.deleteIfExists(installerJar);
        }

        // The installer's exit code is unreliable in-process, so verify on disk: the version
        // json is what the launcher actually needs.
        Path versionJson = versionDir.resolve(BuildInfo.FORGE_VERSION_ID + ".json");
        boolean ok = Files.isRegularFile(versionJson);
        if (ok) pr.log("Forge " + BuildInfo.FORGE_VERSION_ID + " installed.");
        else pr.log("WARNING: Forge version file not found: " + versionJson);
        return ok;
    }

    private static void runInProcess(Path jar, Path dotMc, ProgressReporter pr) throws Exception {
        String mainClass = mainClassOf(jar);
        pr.log("Installing Forge in-process (" + mainClass + ") — downloading libraries, this can take a minute…");
        pr.busy();

        SecurityManager prevSm = System.getSecurityManager();
        ClassLoader prevCtx = Thread.currentThread().getContextClassLoader();

        try (URLClassLoader cl = new URLClassLoader(
                new URL[]{ jar.toUri().toURL() }, ClassLoader.getPlatformClassLoader())) {

            System.setSecurityManager(new ExitTrap());
            Thread.currentThread().setContextClassLoader(cl);

            Class<?> main = Class.forName(mainClass, true, cl);
            Method m = main.getMethod("main", String[].class);
            try {
                m.invoke(null, (Object) new String[]{ "--installClient", dotMc.toString() });
                pr.log("Forge installer returned.");
            } catch (InvocationTargetException ite) {
                Integer code = ExitTrap.statusOf(ite.getCause());
                if (code != null) {
                    // Forge exits 0 on success, but its outer catch can turn our trapped exit
                    // into a misleading non-zero code. Don't trust it — verify on disk afterwards.
                    pr.log("Forge installer signalled exit code " + code + " — verifying on disk…");
                } else {
                    Throwable c = ite.getCause();
                    pr.log("Forge installer reported: " + (c == null ? ite : c));
                }
            }
        } finally {
            System.setSecurityManager(prevSm);
            Thread.currentThread().setContextClassLoader(prevCtx);
        }
    }

    private static String mainClassOf(Path jar) {
        try (JarFile jf = new JarFile(jar.toFile())) {
            Manifest mf = jf.getManifest();
            if (mf != null) {
                String mc = mf.getMainAttributes().getValue("Main-Class");
                if (mc != null && !mc.isBlank()) return mc.trim();
            }
        } catch (IOException ignored) {}
        return FALLBACK_MAIN;
    }

    /** SecurityManager that converts {@code System.exit(n)} into a catchable exception. */
    private static final class ExitTrap extends SecurityManager {
        @Override public void checkExit(int status) { throw new ExitException(status); }
        @Override public void checkPermission(Permission perm) { /* allow everything else */ }
        @Override public void checkPermission(Permission perm, Object ctx) { /* allow */ }

        static Integer statusOf(Throwable t) {
            for (Throwable c = t; c != null; c = c.getCause()) {
                if (c instanceof ExitException e) return e.status;
            }
            return null;
        }
    }

    private static final class ExitException extends SecurityException {
        final int status;
        ExitException(int status) { super("exit " + status); this.status = status; }
    }
}
