# Force close any vim processes
Get-Process | Where-Object {$_.Name -like "*vim*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Reset git editor to notepad
git config --global core.editor "notepad"

# Check git status
git status
