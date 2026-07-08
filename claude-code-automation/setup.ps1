$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath 'Claude Automation.lnk'

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'code'
$Shortcut.Arguments = '--command claude-code-automation.openUI'
$Shortcut.Description = 'Launch Claude Code Automation in VS Code'
$Shortcut.Save()

Write-Host "Shortcut created on your Desktop at: $ShortcutPath"
Write-Host "You can now double click it to open the automation UI."
