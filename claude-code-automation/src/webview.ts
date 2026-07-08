import * as vscode from 'vscode';
import { AutomationTask } from './types';
import { TaskStorage } from './storage';

export class AutomationWebview {
    public static currentPanel: AutomationWebview | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, private storage: TaskStorage) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveTask':
                        this.storage.addTask(message.task);
                        this._updateWebview();
                        return;
                    case 'updateTask':
                        this.storage.updateTask(message.task);
                        this._updateWebview();
                        return;
                    case 'deleteTask':
                        this.storage.deleteTask(message.taskId);
                        this._updateWebview();
                        return;
                    case 'toggleTask':
                        const tasks = this.storage.getTasks();
                        const taskToToggle = tasks.find(t => t.id === message.taskId);
                        if (taskToToggle) {
                            taskToToggle.enabled = !taskToToggle.enabled;
                            this.storage.updateTask(taskToToggle);
                        }
                        this._updateWebview();
                        return;
                }
            },
            null,
            this._disposables
        );
        
        // Initial load
        this._updateWebview();
    }

    public static createOrShow(storage: TaskStorage) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (AutomationWebview.currentPanel) {
            AutomationWebview.currentPanel._panel.reveal(column);
            AutomationWebview.currentPanel._updateWebview();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'claudeCodeAutomation',
            'Claude Code Automation',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        AutomationWebview.currentPanel = new AutomationWebview(panel, storage);
    }

    private _updateWebview() {
        const tasks = this.storage.getTasks();
        this._panel.webview.postMessage({ command: 'loadTasks', tasks });
    }

    public dispose() {
        AutomationWebview.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Automation</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background);
            --fg-color: var(--vscode-editor-foreground);
            --border-color: var(--vscode-widget-border);
            --button-bg: var(--vscode-button-background);
            --button-fg: var(--vscode-button-foreground);
            --button-hover: var(--vscode-button-hoverBackground);
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --input-border: var(--vscode-input-border);
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--fg-color);
            background-color: var(--bg-color);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2 {
            font-weight: 300;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
            background: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--input-border);
            border-radius: 4px;
        }
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        button {
            padding: 10px 15px;
            background: var(--button-bg);
            color: var(--button-fg);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: var(--button-hover);
        }
        .task-list {
            margin-top: 30px;
        }
        .task-item {
            border: 1px solid var(--border-color);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            background: rgba(0,0,0,0.1);
        }
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .task-actions button {
            margin-left: 5px;
            padding: 5px 10px;
            font-size: 12px;
        }
        .task-prompt {
            white-space: pre-wrap;
            font-family: monospace;
            background: var(--input-bg);
            padding: 10px;
            border-radius: 4px;
        }
        .disabled {
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Claude Code Automation</h1>
        
        <div class="card">
            <h2>Add New Task</h2>
            <div class="form-group">
                <label for="prompt">Prompt (Limitless characters)</label>
                <textarea id="prompt" placeholder="Enter your prompt for Claude Code..."></textarea>
            </div>
            <div class="form-group">
                <label for="time">Scheduled Time (Military HH:mm)</label>
                <input type="time" id="time" required>
            </div>
            <div class="form-group">
                <label for="directory">Project Directory (Absolute Path)</label>
                <input type="text" id="directory" placeholder="C:\\path\\to\\project">
            </div>
            <button id="saveBtn">Save Task</button>
        </div>

        <div class="task-list" id="taskList">
            <h2>Scheduled Tasks</h2>
            <!-- Tasks will be rendered here -->
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('saveBtn').addEventListener('click', () => {
            const prompt = document.getElementById('prompt').value;
            const time = document.getElementById('time').value;
            const directory = document.getElementById('directory').value;
            
            if (!prompt || !time || !directory) {
                alert('Please fill out all fields');
                return;
            }

            const task = {
                id: Date.now().toString(),
                prompt,
                scheduledTime: time,
                projectDirectory: directory,
                enabled: true
            };

            vscode.postMessage({ command: 'saveTask', task });
            
            document.getElementById('prompt').value = '';
            document.getElementById('time').value = '';
            document.getElementById('directory').value = '';
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadTasks':
                    renderTasks(message.tasks);
                    break;
            }
        });

        function renderTasks(tasks) {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '<h2>Scheduled Tasks</h2>';
            
            if (tasks.length === 0) {
                taskList.innerHTML += '<p>No tasks scheduled yet.</p>';
                return;
            }

            tasks.forEach(task => {
                const div = document.createElement('div');
                div.className = \`task-item \${!task.enabled ? 'disabled' : ''}\`;
                
                div.innerHTML = \`
                    <div class="task-header">
                        <div>
                            <strong>Time:</strong> \${task.scheduledTime} <br/>
                            <small>Dir: \${task.projectDirectory}</small>
                        </div>
                        <div class="task-actions">
                            <button onclick="toggleTask('\${task.id}')">\${task.enabled ? 'Disable' : 'Enable'}</button>
                            <button onclick="deleteTask('\${task.id}')" style="background: #a00; color: white;">Delete</button>
                        </div>
                    </div>
                    <div class="task-prompt">\${task.prompt}</div>
                \`;
                taskList.appendChild(div);
            });
        }

        window.toggleTask = function(taskId) {
            vscode.postMessage({ command: 'toggleTask', taskId });
        };

        window.deleteTask = function(taskId) {
            if(confirm('Are you sure you want to delete this task?')) {
                vscode.postMessage({ command: 'deleteTask', taskId });
            }
        };
    </script>
</body>
</html>`;
    }
}
