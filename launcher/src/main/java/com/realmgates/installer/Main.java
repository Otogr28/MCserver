package com.realmgates.installer;

import com.realmgates.installer.ui.InstallerFrame;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/** Entry point: launches the Swing installer UI. */
public final class Main {

    public static void main(String[] args) {
        // Quiet the SLF4J simple logger to warnings by default.
        System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", "warn");

        Thread.setDefaultUncaughtExceptionHandler((t, e) ->
                System.err.println("Uncaught in " + t.getName() + ": " + e));

        SwingUtilities.invokeLater(() -> {
            try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); }
            catch (Exception ignored) {}
            new InstallerFrame().setVisible(true);
        });
    }
}
