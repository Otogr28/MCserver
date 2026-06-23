package com.realmgates.installer.install;

import com.realmgates.installer.core.ProgressReporter;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

/** Minimal HTTP file downloader with progress reporting and redirect following. */
public final class Downloader {

    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private Downloader() {}

    public static void download(String url, Path target, ProgressReporter pr) throws IOException, InterruptedException {
        pr.log("Downloading " + url);
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "realmgates-installer")
                .timeout(Duration.ofMinutes(10))
                .GET().build();

        HttpResponse<InputStream> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (resp.statusCode() / 100 != 2) {
            throw new IOException("HTTP " + resp.statusCode() + " for " + url);
        }
        long total = resp.headers().firstValueAsLong("content-length").orElse(-1);
        Files.createDirectories(target.toAbsolutePath().getParent());

        try (InputStream in = resp.body(); OutputStream out = Files.newOutputStream(target)) {
            byte[] buf = new byte[1 << 16];
            long read = 0; int n; int lastPct = -1;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
                read += n;
                if (total > 0) {
                    int pct = (int) (read * 100 / total);
                    if (pct != lastPct) { pr.progress(pct); lastPct = pct; }
                } else {
                    pr.busy();
                }
            }
        }
        pr.log("Downloaded " + (Files.size(target) / 1024) + " KB");
    }
}
