import * as vscode from 'vscode';
import { TimerStatus, TimerState } from './types';
import { StatusBarManager } from './statusBar';
import { Config } from './config';
import { CelebrationManager } from './celebration';

export class Timer {
    private state: TimerState;
    private interval: NodeJS.Timeout | null = null;
    private readonly statusBar: StatusBarManager;
    private readonly celebrationManager: CelebrationManager;
    private sessionCount: number = 0;

    constructor(context: vscode.ExtensionContext) {
        this.statusBar = new StatusBarManager(context);
        this.celebrationManager = new CelebrationManager(context);
        this.state = {
            status: TimerStatus.STOPPED,
            startTime: null,
            remainingTime: Config.getDefaultDuration(),
            duration: Config.getDefaultDuration()
        };
        // Initialize status bar immediately
        this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);
    }

    private async handleComplete() {
        this.state.status = TimerStatus.FINISHED;
        this.sessionCount++;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (Config.areCelebrationsEnabled()) {
            const minutes = Math.floor(this.state.duration / (1000 * 60));
            const hadNewAchievement = await this.celebrationManager.showCompletionCelebration(minutes);

            this.statusBar.showCelebrationAnimation();
            if (hadNewAchievement) {
                this.statusBar.startFlashing();
            }

            // Replace popup with side notification
            const breakChoice = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Time for a break! 🎉',
                cancellable: true
            }, async (progress) => {
                return await vscode.window.showInformationMessage(
                    'Choose your break duration:',
                    { modal: false },  // Ensure it's not a modal popup
                    '5 min break ☕',
                    '15 min break 🌟',
                    'Keep working 💪'
                );
            });

            if (breakChoice && !breakChoice.includes('Keep working')) {
                const breakDuration = breakChoice.includes('5 min') ? 5 : 15;
                this.startBreak(breakDuration);
            }
        }

        // Update status bar one final time
        this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);
    }

    private startBreak(duration: number) {
        // Store current settings
        const originalDuration = this.state.duration;
        const originalRemaining = this.state.remainingTime;

        // Set break duration
        this.state.duration = duration * 60 * 1000;
        this.state.remainingTime = this.state.duration;
        this.state.status = TimerStatus.STOPPED;

        // Show break timer
        void vscode.window.showInformationMessage(
            `Starting ${duration} minute break timer...`
        );

        // Start break timer
        this.start();

        // When break timer completes, restore original duration
        const breakInterval = setInterval(() => {
            if (this.state.status === TimerStatus.FINISHED) {
                clearInterval(breakInterval);
                this.state.duration = originalDuration;
                this.state.remainingTime = originalDuration;
                this.statusBar.updateStatusBar(TimerStatus.STOPPED, this.state.remainingTime);

                void vscode.window.showInformationMessage(
                    'Break time is over! Ready to focus again?',
                    'Start New Session 🚀',
                    'Take More Time ⏰'
                ).then(choice => {
                    if (choice === 'Start New Session 🚀') {
                        this.start();
                    }
                });
            }
        }, 1000);
    }

    start() {
        if (this.state.status !== TimerStatus.RUNNING) {
            this.state.status = TimerStatus.RUNNING;
            this.state.startTime = new Date();

            if (this.state.remainingTime === 0) {
                this.state.remainingTime = this.state.duration;
            }

            if (this.interval) {
                clearInterval(this.interval);
            }

            this.interval = setInterval(() => {
                if (this.state.startTime) {
                    const currentTime = new Date();
                    const elapsedTime = currentTime.getTime() - this.state.startTime.getTime();
                    this.state.remainingTime = Math.max(0, this.state.duration - elapsedTime);

                    if (this.state.remainingTime === 0) {
                        void this.handleComplete();
                    }
                }
                this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);
            }, 1000);

            // Show encouragement message when starting
            const startMessages = [
                "Let's focus! 🎯",
                "Time to shine! ✨",
                "You've got this! 💪",
                "Focus mode: activated! 🚀",
                "Ready, set, focus! 🎬"
            ];
            const message = startMessages[Math.floor(Math.random() * startMessages.length)];
            void vscode.window.showInformationMessage(message);

            this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);
        }
    }

    stop() {
        if (this.state.status === TimerStatus.RUNNING) {
            this.state.status = TimerStatus.STOPPED;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);

            // Show paused message
            void vscode.window.showInformationMessage(
                'Timer paused. Take a quick breather! 😌',
                'Resume ▶️',
                'Reset 🔄'
            ).then(choice => {
                if (choice === 'Resume ▶️') {
                    this.start();
                } else if (choice === 'Reset 🔄') {
                    this.reset();
                }
            });
        }
    }

    reset() {
        this.state.status = TimerStatus.STOPPED;
        this.state.startTime = null;
        this.state.remainingTime = this.state.duration;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);

        // Show reset message
        void vscode.window.showInformationMessage(
            'Timer reset! Ready for a fresh start? 🌟',
            'Start Now 🚀'
        ).then(choice => {
            if (choice === 'Start Now 🚀') {
                this.start();
            }
        });
    }

    async setDuration() {
        const minutes = await vscode.window.showInputBox({
            title: 'Set Timer Duration',
            prompt: 'Enter duration in minutes (1-120)',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 1 || num > 120) {
                    return 'Please enter a number between 1 and 120';
                }
                return null;
            }
        });

        if (minutes) {
            const duration = parseInt(minutes) * 60 * 1000;
            this.state.duration = duration;
            this.state.remainingTime = duration;
            await Config.setDefaultDuration(parseInt(minutes));
            this.statusBar.updateStatusBar(this.state.status, this.state.remainingTime);

            // Show confirmation with quick start option
            void vscode.window.showInformationMessage(
                `Timer set to ${minutes} minutes! ⏰`,
                'Start Now 🚀',
                'Maybe Later ⏳'
            ).then(choice => {
                if (choice === 'Start Now 🚀') {
                    this.start();
                }
            });
        }
    }

    setMenuCommand(command: string) {
        this.statusBar.setCommand(command);
    }

    // Get current state for external use
    getState(): TimerState {
        return { ...this.state };
    }

    // Get session count for achievements
    getSessionCount(): number {
        return this.sessionCount;
    }
}