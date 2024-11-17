import * as vscode from 'vscode';
import { Timer } from './timer';

export function activate(context: vscode.ExtensionContext) {
    // Create and initialize timer
    const timer = new Timer(context);

    // Register commands
    const commands = [
        { id: 'vscode-timer-status.start', handler: () => timer.start() },
        { id: 'vscode-timer-status.stop', handler: () => timer.stop() },
        { id: 'vscode-timer-status.reset', handler: () => timer.reset() },
        { id: 'vscode-timer-status.setDuration', handler: () => timer.setDuration() }
    ];

    commands.forEach(command => {
        context.subscriptions.push(
            vscode.commands.registerCommand(command.id, command.handler)
        );
    });

    // Register menu handler
    const commandHandler = async () => {
        const items: vscode.QuickPickItem[] = [
            {
                label: "$(play) Start Timer",
                description: "Start the timer",
            },
            {
                label: "$(debug-stop) Stop Timer",
                description: "Pause the timer",
            },
            {
                label: "$(debug-restart) Reset Timer",
                description: "Reset timer",
            },
            {
                label: "$(settings-gear) Set Duration",
                description: "Change timer duration",
            }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: "Select timer action",
        });

        if (selection) {
            const commandMap: { [key: string]: string } = {
                "Start": 'vscode-timer-status.start',
                "Stop": 'vscode-timer-status.stop',
                "Reset": 'vscode-timer-status.reset',
                "Duration": 'vscode-timer-status.setDuration'
            };

            for (const [key, command] of Object.entries(commandMap)) {
                if (selection.label.includes(key)) {
                    void vscode.commands.executeCommand(command);
                    break;
                }
            }
        }
    };

    // Register menu command
    const menuCommand = 'vscode-timer-status.showMenu';
    context.subscriptions.push(
        vscode.commands.registerCommand(menuCommand, commandHandler)
    );
    timer.setMenuCommand(menuCommand);
}

export function deactivate() {}