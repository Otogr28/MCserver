package com.realmgates.installer.ui;

import com.realmgates.installer.core.ProgressReporter;

import javax.swing.BorderFactory;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;

/** Scrolling log + progress bar that doubles as the {@link ProgressReporter}. */
public final class LogPanel extends JPanel implements ProgressReporter {

    private final JTextArea area = new JTextArea();
    private final JProgressBar bar = new JProgressBar(0, 100);

    public LogPanel() {
        super(new BorderLayout(0, 6));
        area.setEditable(false);
        area.setLineWrap(true);
        area.setWrapStyleWord(true);
        area.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JScrollPane scroll = new JScrollPane(area);
        scroll.setPreferredSize(new Dimension(660, 280));
        scroll.setBorder(BorderFactory.createTitledBorder("Progress"));
        bar.setStringPainted(true);
        add(scroll, BorderLayout.CENTER);
        add(bar, BorderLayout.SOUTH);
    }

    @Override public void log(String message) {
        SwingUtilities.invokeLater(() -> {
            area.append(message + "\n");
            area.setCaretPosition(area.getDocument().getLength());
        });
    }

    @Override public void progress(int percent) {
        SwingUtilities.invokeLater(() -> {
            if (percent < 0) {
                bar.setIndeterminate(true);
                bar.setString("working…");
            } else {
                bar.setIndeterminate(false);
                bar.setValue(percent);
                bar.setString(percent + "%");
            }
        });
    }
}
