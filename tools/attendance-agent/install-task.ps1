# Starts the gate agent whenever this Windows user signs in, and keeps it running on battery.
# Run once from this folder: powershell -ExecutionPolicy Bypass -File install-task.ps1
# Remove it again with:      Unregister-ScheduledTask -TaskName "Kiddiewise Gate Agent" -Confirm:$false

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $here ".venv\Scripts\pythonw.exe"
$agent = Join-Path $here "agent.py"

if (-not (Test-Path $python)) { throw "Set up .venv first (see README.md, step 3)." }
if (-not (Test-Path (Join-Path $here "config.ini"))) { throw "Create config.ini first (see README.md, step 4)." }

$action = New-ScheduledTaskAction -Execute $python -Argument "`"$agent`"" -WorkingDirectory $here
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
# Windows' defaults would stop a laptop's task on battery and after three days; neither is wanted.
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "Kiddiewise Gate Agent" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName "Kiddiewise Gate Agent"
Write-Host "Installed. The agent is running and will start whenever $env:USERNAME signs in."
