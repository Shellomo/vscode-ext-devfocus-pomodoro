import * as vscode from 'vscode';
import { DailyStats, Achievement } from './types';
import { ACHIEVEMENTS, MOTIVATIONAL_QUOTES } from './constants';
import { Storage } from './storage';

export class CelebrationManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private showAchievementNotification(achievement: Achievement) {
        void vscode.window.showInformationMessage(
            `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}`,
            'Nice! 🎉'
        );
    }

    async checkAndTriggerAchievements(stats: DailyStats) {
        const achievements = await Storage.getAchievements(this.context);
        const newAchievements: Achievement[] = [];

        ACHIEVEMENTS.forEach(achievement => {
            const existing = achievements.find(a => a.id === achievement.id);
            if (!existing || !existing.unlocked) {
                let unlocked = false;

                switch (achievement.id) {
                    case 'first_pomodoro':
                        unlocked = stats.pomodorosCompleted >= 1;
                        break;
                    case 'three_in_row':
                        unlocked = stats.pomodorosCompleted >= 3;
                        break;
                    case 'daily_master':
                        unlocked = stats.pomodorosCompleted >= 8;
                        break;
                    case 'streak_3':
                        unlocked = stats.currentStreak >= 3;
                        break;
                }

                if (unlocked) {
                    const newAchievement = {
                        ...achievement,
                        unlocked: true,
                        date: new Date()
                    };
                    newAchievements.push(newAchievement);
                    this.showAchievementNotification(newAchievement);
                }
            }
        });

        if (newAchievements.length > 0) {
            await Storage.updateAchievements(this.context, [
                ...achievements.filter(a => !newAchievements.find(na => na.id === a.id)),
                ...newAchievements
            ]);
        }

        return newAchievements;
    }

    async showCompletionCelebration(minutes: number) {
        const stats = await Storage.updateDailyStats(this.context, minutes);
        const newAchievements = await this.checkAndTriggerAchievements(stats);

        // Show stats notification
        const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        await vscode.window.showInformationMessage(
            `${quote}\n\nToday's Focus: ${stats.pomodorosCompleted} sessions (${stats.totalMinutesFocused} minutes)\nCurrent Streak: ${stats.currentStreak} days`
        );

        return newAchievements.length > 0;
    }
}