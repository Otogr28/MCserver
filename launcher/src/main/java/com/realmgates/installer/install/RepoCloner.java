package com.realmgates.installer.install;

import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.ProgressReporter;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.NullProgressMonitor;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Clones the public modpack repo (no auth, no native git) and recognises an existing clone. */
public final class RepoCloner {

    private RepoCloner() {}

    /** A clone exists at {@code dir} when it has a .git whose origin points at our repo. */
    public static boolean isOurClone(Path dir) {
        File gitDir = dir.resolve(".git").toFile();
        if (!gitDir.exists()) return false;
        try (Repository repo = new FileRepositoryBuilder().setGitDir(gitDir).readEnvironment().build()) {
            StoredConfig cfg = repo.getConfig();
            String origin = cfg.getString("remote", "origin", "url");
            return origin != null && origin.replace(".git", "").endsWith("Otogr28/MCserver");
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Heuristic: does {@code dir} look like an existing Minecraft launcher root (the single game dir
     * TLauncher / the official launcher / SKlauncher download versions and libraries into)? A bare
     * profile game directory does NOT have these — only a launcher root does.
     */
    public static boolean looksLikeMinecraftDir(Path dir) {
        if (!Files.isDirectory(dir)) return false;
        return Files.exists(dir.resolve("launcher_profiles.json"))
                || Files.isDirectory(dir.resolve("versions"))
                || Files.isDirectory(dir.resolve("assets"))
                || Files.isDirectory(dir.resolve("libraries"));
    }

    /**
     * Turn an existing (non-empty) Minecraft directory into a Realm Gates overlay: {@code git init}
     * it in place and wire {@code origin} to our repo, WITHOUT checking out the tree. The caller then
     * materialises only the modpack's game folders on top (see {@code SyncEngine}), so the user's
     * {@code versions/}, {@code libraries/}, worlds and options are left untouched. This is how
     * TLauncher (one shared game dir, no per-profile gameDir) gets the modpack.
     */
    public static void overlayInit(Path dir, ProgressReporter pr) throws Exception {
        Files.createDirectories(dir);
        if (!dir.resolve(".git").toFile().exists()) {
            pr.log("Linking " + dir + " to the Realm Gates repo (overlay install — your existing files are kept).");
            Git.init().setDirectory(dir.toFile()).call().close();
        }
        try (Git git = Git.open(dir.toFile())) {
            StoredConfig cfg = git.getRepository().getConfig();
            if (cfg.getString("remote", "origin", "url") == null) {
                cfg.setString("remote", "origin", "url", BuildInfo.REPO_URL);
                cfg.setString("remote", "origin", "fetch", "+refs/heads/*:refs/remotes/origin/*");
                cfg.save();
            }
        }
    }

    public static void clone(Path dir, ProgressReporter pr) throws Exception {
        Files.createDirectories(dir.getParent() == null ? dir : dir.getParent());
        pr.log("Cloning " + BuildInfo.REPO_URL + " -> " + dir + " (this can take a minute)…");
        pr.busy();
        try (Git git = Git.cloneRepository()
                .setURI(BuildInfo.REPO_URL)
                .setDirectory(dir.toFile())
                .setBranch(BuildInfo.REPO_BRANCH)
                .setProgressMonitor(NullProgressMonitor.INSTANCE)
                .call()) {
            pr.log("Clone complete.");
        }
    }
}
