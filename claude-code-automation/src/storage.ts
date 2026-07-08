import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AutomationTask } from './types';

export class TaskStorage {
    private storagePath: string;

    constructor(context: vscode.ExtensionContext) {
        // Ensure the global storage directory exists
        const storageUri = context.globalStorageUri;
        if (!fs.existsSync(storageUri.fsPath)) {
            fs.mkdirSync(storageUri.fsPath, { recursive: true });
        }
        this.storagePath = path.join(storageUri.fsPath, 'tasks.json');
    }

    public getTasks(): AutomationTask[] {
        if (!fs.existsSync(this.storagePath)) {
            return [];
        }
        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            return JSON.parse(data) as AutomationTask[];
        } catch (e) {
            vscode.window.showErrorMessage('Failed to read tasks.json');
            return [];
        }
    }

    public saveTasks(tasks: AutomationTask[]): void {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(tasks, null, 2), 'utf8');
        } catch (e) {
            vscode.window.showErrorMessage('Failed to write to tasks.json');
        }
    }

    public addTask(task: AutomationTask): void {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
    }

    public updateTask(updatedTask: AutomationTask): void {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index > -1) {
            tasks[index] = updatedTask;
            this.saveTasks(tasks);
        }
    }

    public deleteTask(taskId: string): void {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(tasks);
    }
}
