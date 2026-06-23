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
