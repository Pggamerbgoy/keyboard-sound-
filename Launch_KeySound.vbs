Set WshShell = CreateObject("WScript.Shell")
' Get the directory where the script is located
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptPosition)
' Run the app silently
WshShell.Run "cmd /c cd /d " & Chr(34) & strPath & Chr(34) & " && npm start", 0, false
