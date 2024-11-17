import * as vscode from 'vscode';

export class Config {
    static getDefaultDuration(): number {
        return vscode.workspace.getConfiguration('pomodoroTimer').get('defaultDuration', 25) * 60 * 1000;
    }

    static areCelebrationsEnabled(): boolean {
        return vscode.workspace.getConfiguration('pomodoroTimer').get('enableCelebrations', true);
    }

    static async setDefaultDuration(minutes: number): Promise<void> {
        await vscode.workspace.getConfiguration('pomodoroTimer').update('defaultDuration', minutes, true);
    }
}