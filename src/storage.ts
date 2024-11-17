import * as vscode from 'vscode';
import {Achievement, DailyStats} from './types';

export class Storage {
    private static readonly STATS_KEY = 'pomodoroStats';
    private static readonly ACHIEVEMENTS_KEY = 'pomodoroAchievements';

    static async getDailyStats(context: vscode.ExtensionContext): Promise<DailyStats> {
        return context.globalState.get<DailyStats>(this.STATS_KEY) || {
            pomodorosCompleted: 0,
            totalMinutesFocused: 0,
            currentStreak: 0
        };
    }

    static async updateDailyStats(context: vscode.ExtensionContext, minutes: number): Promise<DailyStats> {
        const stats = await this.getDailyStats(context);
        const today = new Date();

        // Reset if it's a new day
        if (!stats.lastCompletedDate || !this.isSameDay(new Date(stats.lastCompletedDate), today)) {
            if (this.isConsecutiveDay(new Date(stats.lastCompletedDate || 0), today)) {
                stats.currentStreak++;
            } else {
                stats.currentStreak = 1;
            }
            stats.pomodorosCompleted = 1;
            stats.totalMinutesFocused = minutes;
        } else {
            stats.pomodorosCompleted++;
            stats.totalMinutesFocused += minutes;
        }

        stats.lastCompletedDate = today;
        await context.globalState.update(this.STATS_KEY, stats);
        return stats;
    }

    private static isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    private static isConsecutiveDay(prev: Date, current: Date): boolean {
        const oneDayMs = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((current.getTime() - prev.getTime()) / oneDayMs);
        return diffDays === 1;
    }

    static async getAchievements(context: vscode.ExtensionContext): Promise<Achievement[]> {
        return context.globalState.get<Achievement[]>(this.ACHIEVEMENTS_KEY) || [];
    }

    static async updateAchievements(context: vscode.ExtensionContext, achievements: Achievement[]): Promise<void> {
        await context.globalState.update(this.ACHIEVEMENTS_KEY, achievements);
    }
}
