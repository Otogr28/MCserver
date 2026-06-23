package com.realmgates.installer.sync;

import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.Platform;
import com.realmgates.installer.core.ProgressReporter;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectInserter;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Selective sync. Only these paths are forced to match the server; everything else on disk
 * (config/oculus.properties with the player's shader tier, *-client.* settings, options.txt,
 * worlds, logs) is left untouched — even tracked files.
 *
 * <p>Implementation: it never moves HEAD or runs reset/checkout. It resolves the upstream tree
 * from {@code origin/master} and materialises ONLY the forced sub-trees onto disk, pruning files
 * removed upstream within those paths. A new upstream file outside the forced paths is never
 * pulled — exactly the requested behaviour.
 */
public final class SyncEngine {

    /** Admin owns these — overwrite + prune within them. */
    public static final List<String> FORCE_PATHS = List.of("mods", "kubejs", "config/fancymenu");

    private SyncEngine() {}

    public static void sync(Path installDir, boolean keepExtraMods, ProgressReporter pr) throws Exception {
        try (Git git = Git.open(installDir.toFile())) {
            Repository repo = git.getRepository();

            pr.log("Fetching latest from " + BuildInfo.REPO_URL);
            pr.busy();
            git.fetch()
                    .setRemote("origin")
                    .setRefSpecs(new RefSpec("+refs/heads/" + BuildInfo.REPO_BRANCH
                            + ":refs/remotes/origin/" + BuildInfo.REPO_BRANCH))
                    .call();

            ObjectId commitId = repo.resolve("refs/remotes/origin/" + BuildInfo.REPO_BRANCH + "^{commit}");
            if (commitId == null) throw new IllegalStateException("Could not resolve origin/" + BuildInfo.REPO_BRANCH);

            try (RevWalk rw = new RevWalk(repo)) {
                RevCommit commit = rw.parseCommit(commitId);
                RevTree tree = commit.getTree();

                int totalWritten = 0, totalPruned = 0;
                for (String forced : FORCE_PATHS) {
                    boolean prune = !(forced.equals("mods") && keepExtraMods);
                    pr.log("Updating " + forced + (prune ? "" : " (keeping your extra mods)"));

                    Map<String, Entry> desired = collect(repo, tree, forced);
                    totalWritten += materialize(repo, installDir, desired, pr);
                    if (prune) totalPruned += prune(installDir, forced, desired, pr);
                }
                pr.progress(100);
                pr.log("Sync done — " + totalWritten + " file(s) updated, " + totalPruned + " removed. "
                        + "Your shader/config and personal settings were left untouched.");
            }
        }
    }

    private record Entry(ObjectId id, boolean executable) {}

    /** repo-relative path (forward slashes) -> blob entry, for everything under {@code base}. */
    private static Map<String, Entry> collect(Repository repo, RevTree tree, String base) throws Exception {
        Map<String, Entry> map = new LinkedHashMap<>();
        try (TreeWalk tw = new TreeWalk(repo)) {
            tw.addTree(tree);
            tw.setRecursive(true);
            tw.setFilter(PathFilter.create(base));
            while (tw.next()) {
                map.put(tw.getPathString(),
                        new Entry(tw.getObjectId(0), tw.getFileMode(0) == FileMode.EXECUTABLE_FILE));
            }
        }
        return map;
    }

    private static int materialize(Repository repo, Path installDir, Map<String, Entry> desired,
                                   ProgressReporter pr) throws Exception {
        int written = 0;
        for (Map.Entry<String, Entry> e : desired.entrySet()) {
            Path dest = installDir.resolve(e.getKey());           // forward slashes resolve fine
            ObjectId want = e.getValue().id();
            if (Files.exists(dest) && want.equals(blobId(repo, dest))) continue; // unchanged — skip
            writeBlob(repo, want, dest);
            if (e.getValue().executable() && !Platform.isWindows()) {
                try { dest.toFile().setExecutable(true, false); } catch (Exception ignored) {}
            }
            written++;
        }
        return written;
    }

    private static int prune(Path installDir, String base, Map<String, Entry> desired, ProgressReporter pr)
            throws Exception {
        Path dir = installDir.resolve(base);   // resolve(String) accepts '/' on every OS
        if (!Files.isDirectory(dir)) return 0;
        int removed = 0;
        List<Path> files;
        try (Stream<Path> s = Files.walk(dir)) {
            files = s.filter(Files::isRegularFile).toList();
        }
        for (Path f : files) {
            String rel = installDir.relativize(f).toString().replace('\\', '/');
            if (!desired.containsKey(rel)) { Files.delete(f); removed++; }
        }
        // tidy up now-empty directories (bottom-up)
        try (Stream<Path> s = Files.walk(dir)) {
            s.filter(Files::isDirectory).sorted(Comparator.reverseOrder()).forEach(d -> {
                try (Stream<Path> kids = Files.list(d)) {
                    if (kids.findAny().isEmpty() && !d.equals(dir)) Files.delete(d);
                } catch (Exception ignored) {}
            });
        }
        return removed;
    }

    /** Git blob id of an on-disk file, without inserting it — used to skip unchanged files. */
    private static ObjectId blobId(Repository repo, Path file) throws Exception {
        try (ObjectInserter oi = repo.newObjectInserter(); InputStream in = Files.newInputStream(file)) {
            return oi.idFor(Constants.OBJ_BLOB, Files.size(file), in);
        }
    }

    /** Stream a blob to disk atomically (temp in the same dir, then move). */
    private static void writeBlob(Repository repo, ObjectId id, Path dest) throws Exception {
        Path parent = dest.toAbsolutePath().getParent();
        Files.createDirectories(parent);
        Path tmp = Files.createTempFile(parent, ".rg-", ".tmp");
        try {
            ObjectLoader loader = repo.open(id);
            try (OutputStream out = Files.newOutputStream(tmp)) { loader.copyTo(out); }
            try {
                Files.move(tmp, dest, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (Exception atomicUnsupported) {
                Files.move(tmp, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

}
