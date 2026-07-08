import * as vscode from 'vscode';
import { AutomationTask } from './types';

export class TaskExecutor {
    constructor(private context: vscode.ExtensionContext) {}

    public async executeTask(task: AutomationTask): Promise<void> {
        let retries = 0;
        const maxRetries = 3;
        
        while (retries <= maxRetries) {
            try {
                const success = await this.runInTerminal(task);
                if (success) {
                    vscode.window.showInformationMessage(`Claude Automation: Task '${task.id}' completed successfully.`);
                    return;
                } else {
                    retries++;
                    if (retries <= maxRetries) {
                        vscode.window.showWarningMessage(`Claude Automation: Task '${task.id}' failed. Retrying (${retries}/${maxRetries})...`);
                    }
                }
            } catch (err) {
                retries++;
                if (retries <= maxRetries) {
                    vscode.window.showWarningMessage(`Claude Automation: Task '${task.id}' errored. Retrying (${retries}/${maxRetries})...`);
                }
            }
        }
        
        vscode.window.showErrorMessage(`Claude Automation: Task '${task.id}' failed after ${maxRetries} retries.`);
    }

    private runInTerminal(task: AutomationTask): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const terminalName = `Claude Auto: ${task.id}`;
            const terminal = vscode.window.createTerminal({
                name: terminalName,
                cwd: task.projectDirectory
            });

            terminal.show();

            // Prepare the command. We use PowerShell syntax since the environment is Windows.
            // Escape double quotes in the prompt.
            const escapedPrompt = task.prompt.replace(/"/g, '`"');
            
            // The command will run claude, pipe to a log file, and exit with the correct code.
            const command = `claude -p "${escapedPrompt}" 2>&1 | Tee-Object -FilePath "claude_automation.log"; exit $LASTEXITCODE`;
            
            vscode.window.showInformationMessage(`Claude Automation: Starting task '${task.id}'.`);
            terminal.sendText(command, true);

            const disposable = vscode.window.onDidCloseTerminal((t) => {
                if (t.name === terminalName) {
                    disposable.dispose();
                    if (t.exitStatus) {
                        resolve(t.exitStatus.code === 0);
                    } else {
                        // If no exit status is available, assume success or failure depending on your needs.
                        // We will resolve false to trigger a retry if it closed abruptly without code 0.
                        resolve(false);
                    }
                }
            });
        });
    }
}
