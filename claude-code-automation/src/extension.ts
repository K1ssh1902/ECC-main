import * as vscode from 'vscode';
import { TaskStorage } from './storage';
import { TaskExecutor } from './executor';
import { Scheduler } from './scheduler';
import { AutomationWebview } from './webview';

let scheduler: Scheduler | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Code Automation extension is now active!');

    const storage = new TaskStorage(context);
    const executor = new TaskExecutor(context);
    scheduler = new Scheduler(storage, executor);

    // Start the scheduler heartbeat
    scheduler.start();

    // Register the command to open the UI
    let openUICommand = vscode.commands.registerCommand('claude-code-automation.openUI', () => {
        AutomationWebview.createOrShow(storage);
    });

    context.subscriptions.push(openUICommand);
}

export function deactivate() {
    if (scheduler) {
        scheduler.stop();
    }
}
