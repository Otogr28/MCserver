package com.realmgates.installer.ui;

import com.realmgates.installer.core.AppState;
import com.realmgates.installer.core.BuildInfo;
import com.realmgates.installer.core.Orchestrator;
import com.realmgates.installer.core.Platform;
import com.realmgates.installer.hardware.HardwareProbe;
import com.realmgates.installer.hardware.OculusConfig;
import com.realmgates.installer.hardware.ShaderPackChoice;
import com.realmgates.installer.hardware.ShaderPresetChoice;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingWorker;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.nio.file.Path;

/** The single-window installer/sync UI. */
public final class InstallerFrame extends JFrame {

    private final AppState state = AppState.load();
    private final JTextField dirField = new JTextField(36);
    private final JComboBox<ShaderPackChoice> packBox = new JComboBox<>(ShaderPackChoice.values());
    private final JComboBox<ShaderPresetChoice> presetBox = new JComboBox<>(ShaderPresetChoice.values());
    private final JCheckBox keepExtraMods = new JCheckBox("Keep my extra mods");
    private final JLabel ramLabel = new JLabel();
    private final JButton installBtn = new JButton("Install");
    private final JButton syncBtn = new JButton("Sync / Update");
    private final JButton unbindBtn = new JButton("Unbind camera keys");
    private final LogPanel logPanel = new LogPanel();

    public InstallerFrame() {
        super(BuildInfo.APP_NAME + "  ·  Forge " + BuildInfo.FORGE_VERSION_ID);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new BorderLayout(10, 10));
        ((JPanel) getContentPane()).setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));

        dirField.setText(state.installDir);
        packBox.setSelectedItem(ShaderPackChoice.from(state.shaderPack));
        presetBox.setSelectedItem(ShaderPresetChoice.from(state.shaderPreset));
        keepExtraMods.setSelected(state.keepExtraMods);

        add(buildTop(), BorderLayout.NORTH);
        add(logPanel, BorderLayout.CENTER);
        add(buildButtons(), BorderLayout.SOUTH);

        refreshRamLabel();
        pack();
        setMinimumSize(new Dimension(720, 540));
        setLocationRelativeTo(null);
    }

    private JPanel buildTop() {
        JPanel p = new JPanel();
        p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS));

        JPanel row1 = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        row1.add(new JLabel("Install folder:"));
        row1.add(dirField);
        JButton browse = new JButton("Browse…");
        browse.addActionListener(e -> chooseDir());
        row1.add(browse);

        // TLauncher uses one shared game dir (no per-profile gameDir), so the modpack must be
        // installed straight into it. Offer a one-click target when TLauncher is detected.
        if (Platform.hasTLauncher()) {
            Path tlDir = Platform.tlauncherGameDir();
            JButton useTl = new JButton("Use TLauncher folder");
            useTl.setToolTipText("Install the modpack into TLauncher's Minecraft folder: " + tlDir);
            useTl.addActionListener(e -> {
                dirField.setText(tlDir.toString());
                keepExtraMods.setSelected(true); // shared dir — don't prune the player's other mods
            });
            row1.add(useTl);
        }

        JPanel row2 = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        row2.add(new JLabel("Shader pack:"));
        row2.add(packBox);
        row2.add(Box.createHorizontalStrut(8));
        row2.add(new JLabel("Preset:"));
        row2.add(presetBox);
        row2.add(Box.createHorizontalStrut(12));
        row2.add(keepExtraMods);
        row2.add(Box.createHorizontalStrut(12));
        row2.add(ramLabel);
        // "Off" disables the quality preset; AUTO/explicit packs use it.
        packBox.addActionListener(e ->
                presetBox.setEnabled(packBox.getSelectedItem() != ShaderPackChoice.OFF));
        presetBox.setEnabled(packBox.getSelectedItem() != ShaderPackChoice.OFF);

        p.add(row1);
        p.add(row2);
        return p;
    }

    private JPanel buildButtons() {
        JPanel p = new JPanel(new BorderLayout());
        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        left.add(unbindBtn);
        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 4));
        right.add(syncBtn);
        right.add(installBtn);

        installBtn.addActionListener(e -> runInstall());
        syncBtn.addActionListener(e -> runSync());
        unbindBtn.addActionListener(e -> runUnbind());

        p.add(left, BorderLayout.WEST);
        p.add(right, BorderLayout.EAST);
        return p;
    }

    private void refreshRamLabel() {
        HardwareProbe.Info hw = HardwareProbe.probe();
        ramLabel.setText("RAM " + hw.ramGb() + " GB → -Xmx" + OculusConfig.recommendedXmxGb(hw.ramGb()) + "G");
    }

    private void chooseDir() {
        JFileChooser fc = new JFileChooser(dirField.getText());
        fc.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        if (fc.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            dirField.setText(fc.getSelectedFile().getAbsolutePath());
        }
    }

    private void persistState() {
        state.installDir = dirField.getText().trim();
        state.shaderPack = ((ShaderPackChoice) packBox.getSelectedItem()).name();
        state.shaderPreset = ((ShaderPresetChoice) presetBox.getSelectedItem()).name();
        state.keepExtraMods = keepExtraMods.isSelected();
        state.save();
    }

    private void setBusy(boolean busy) {
        installBtn.setEnabled(!busy);
        syncBtn.setEnabled(!busy);
        unbindBtn.setEnabled(!busy);
    }

    private Path dir() { return Path.of(dirField.getText().trim()); }

    private void runTask(Task task) {
        persistState();
        setBusy(true);
        new SwingWorker<Void, Void>() {
            @Override protected Void doInBackground() throws Exception { task.run(); return null; }
            @Override protected void done() {
                setBusy(false);
                try { get(); }
                catch (Exception ex) {
                    Throwable c = ex.getCause() != null ? ex.getCause() : ex;
                    logPanel.log("ERROR: " + c.getMessage());
                }
            }
        }.execute();
    }

    private void runInstall() {
        ShaderPackChoice pack = (ShaderPackChoice) packBox.getSelectedItem();
        ShaderPresetChoice preset = (ShaderPresetChoice) presetBox.getSelectedItem();
        int xmx = state.xmxLocked ? state.xmxGb : 0;
        runTask(() -> Orchestrator.install(dir(), pack, preset, keepExtraMods.isSelected(), xmx, logPanel));
    }

    private void runSync() {
        runTask(() -> Orchestrator.sync(dir(), keepExtraMods.isSelected(), logPanel));
    }

    private void runUnbind() {
        runTask(() -> Orchestrator.unbindCameraKeys(dir(), logPanel));
    }

    @FunctionalInterface private interface Task { void run() throws Exception; }
}
