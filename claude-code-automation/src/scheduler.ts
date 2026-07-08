import * as vscode from 'vscode';
import { TaskStorage } from './storage';
import { TaskExecutor } from './executor';
import { AutomationTask } from './types';
import { format, parse, isAfter, isBefore, addDays } from 'date-fns';

export class Scheduler {
    private timer: NodeJS.Timeout | null = null;
    private lastCheckTime: Date = new Date();

    constructor(
        private storage: TaskStorage,
        private executor: TaskExecutor
    ) {}

    public start() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Run check every 30 seconds
        this.timer = setInterval(() => {
            this.checkTasks();
        }, 30000);

        this.checkTasks(); // Initial check
    }

    public stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private checkTasks() {
        const now = new Date();
        const tasks = this.storage.getTasks();
        const todayDateStr = format(now, 'yyyy-MM-dd');
        
        let updated = false;

        for (let task of tasks) {
            if (!task.enabled) continue;

            // Avoid running twice in the same day unless re-enabled or manually triggered
            // To simplify, if lastRunDate == todayDateStr, skip.
            if (task.lastRunDate === todayDateStr) {
                continue;
            }

            // scheduledTime is in "HH:mm"
            const scheduledTime = parse(task.scheduledTime, 'HH:mm', now);
            
            // Check if we passed the scheduled time
            // If now > scheduledTime, we should run it
            if (isAfter(now, scheduledTime) || now.getTime() === scheduledTime.getTime()) {
                // Execute
                this.executor.executeTask(task);
                task.lastRunDate = todayDateStr;
                updated = true;
            }
        }

        if (updated) {
            this.storage.saveTasks(tasks);
        }

        this.lastCheckTime = now;
    }
}
