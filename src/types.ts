export enum TimerStatus {
    STOPPED = 'Stopped',
    RUNNING = 'Running',
    FINISHED = 'Finished'
}

export interface TimerState {
    status: TimerStatus;
    startTime: Date | null;
    remainingTime: number;
    duration: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    date?: Date;
}

export interface DailyStats {
    pomodorosCompleted: number;
    totalMinutesFocused: number;
    currentStreak: number;
    lastCompletedDate?: Date;
}
