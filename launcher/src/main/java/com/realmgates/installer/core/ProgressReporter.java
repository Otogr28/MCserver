package com.realmgates.installer.core;

/** Sink for progress/log lines and a coarse 0..100 percentage. Implemented by the UI. */
public interface ProgressReporter {

    /** A human-readable status/log line. */
    void log(String message);

    /** Coarse progress; pass a negative value for "indeterminate". */
    void progress(int percent);

    /** Convenience for an indeterminate phase. */
    default void busy() { progress(-1); }

    /** A no-op reporter, handy for tests. */
    ProgressReporter NONE = new ProgressReporter() {
        public void log(String message) {}
        public void progress(int percent) {}
    };
}
