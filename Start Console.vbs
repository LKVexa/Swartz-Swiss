Option Explicit
Dim consoleShell, consoleFiles, consoleRoot, consoleCommand, consolePowerShell, consoleExit
Set consoleShell = CreateObject("WScript.Shell")
Set consoleFiles = CreateObject("Scripting.FileSystemObject")
consoleRoot = consoleFiles.GetParentFolderName(WScript.ScriptFullName)
consoleShell.CurrentDirectory = consoleRoot
If Not consoleFiles.FileExists(consoleRoot & "\GfmJa21.exe") Then WScript.Quit 2
consoleCommand = Chr(34) & consoleRoot & "\GfmJa21.exe" & Chr(34)
consoleExit = consoleShell.Run(consoleCommand, 0, True)
If consoleExit <> 0 Then MsgBox "GFM console startup failed. Run Start GFM Console.cmd to see the error, or read workspace\logs\console-error.txt.", vbExclamation, "GFM JA21 Console"
WScript.Quit consoleExit
