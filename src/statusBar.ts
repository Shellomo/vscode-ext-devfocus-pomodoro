import * as vscode from 'vscode';
import { TimerStatus } from './types';
import {CELEBRATION_EMOJIS, STATUS_BAR_COLORS} from './constants';

export class StatusBarManager {
    private readonly statusBarItem: vscode.StatusBarItem;
    private readonly celebrationItems: vscode.StatusBarItem[] = [];
    private flashInterval: NodeJS.Timeout | null = null;
    private confettiInterval: NodeJS.Timeout | null = null;

    constructor(context: vscode.ExtensionContext) {
        // Create main status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.name = "Pomodoro Timer"; // Add name for better identification
        context.subscriptions.push(this.statusBarItem);

        // Create celebration items
        CELEBRATION_EMOJIS.forEach((emoji, index) => {
            const item = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Right,
                99 - index
            );
            item.text = emoji;
            item.name = `Pomodoro Celebration ${index + 1}`; // Add names for better identification
            this.celebrationItems.push(item);
            context.subscriptions.push(item);
        });

        // Show the main status bar item immediately
        this.statusBarItem.show();
    }

    showCelebrationAnimation() {
        let step = 0;
        const maxSteps = 10;

        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
        }

        this.celebrationItems.forEach(item => item.show());

        this.confettiInterval = setInterval(() => {
            this.celebrationItems.forEach((item, index) => {
                const offset = Math.sin((step + index) * 0.5) * 2;
                item.text = CELEBRATION_EMOJIS[index] + ' '.repeat(Math.abs(Math.floor(offset)));
            });

            step++;
            if (step >= maxSteps) {
                if (this.confettiInterval) {
                    clearInterval(this.confettiInterval);
                }
                setTimeout(() => {
                    this.celebrationItems.forEach(item => item.hide());
                }, 2000);
            }
        }, 200);
    }

    updateStatusBar(status: TimerStatus, remainingTime: number) {
        const minutes = Math.floor(remainingTime / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        let icon = status === TimerStatus.RUNNING ? '$(watch)' : '$(clock)';
        if (status === TimerStatus.FINISHED) {
            icon = '🎉';
        }

        const statusText = status === TimerStatus.FINISHED ? 'Time\'s up!' : status;

        this.statusBarItem.text = `${icon} ${statusText}: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.statusBarItem.tooltip = 'Click to show timer controls';
        this.statusBarItem.backgroundColor = status === TimerStatus.FINISHED ?
            new vscode.ThemeColor('statusBarItem.warningBackground') : undefined;
    }

    startFlashing() {
        let colorIndex = 0;

        if (this.flashInterval) {
            clearInterval(this.flashInterval);
        }

        this.flashInterval = setInterval(() => {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor(
                STATUS_BAR_COLORS[colorIndex % STATUS_BAR_COLORS.length]
            );
            colorIndex++;
        }, 500);

        setTimeout(() => {
            if (this.flashInterval) {
                clearInterval(this.flashInterval);
                this.flashInterval = null;
            }
            this.statusBarItem.backgroundColor = undefined;
        }, 5000);
    }

    setCommand(command: string) {
        this.statusBarItem.command = command;
    }

    dispose() {
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
        }
        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
        }
        this.statusBarItem.dispose();
        this.celebrationItems.forEach(item => item.dispose());
    }
}
