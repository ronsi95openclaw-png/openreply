param(
  [ValidateNotNullOrEmpty()]
  [string]$Distribution = "Ubuntu",
  [ValidateRange(1, 300)]
  [int]$RetrySeconds = 5
)

$ErrorActionPreference = "Stop"

# Resolve from this tracked script, never from the Scheduled Task's working directory.
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $projectRoot "docker-compose.local.yml"
$credentialFiles = @(
  (Join-Path $projectRoot ".env.local"),
  (Join-Path $projectRoot ".env.local-admin")
)

if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
  throw "Expected Docker Compose file at $composeFile."
}

foreach ($credentialFile in $credentialFiles) {
  if (-not (Test-Path -LiteralPath $credentialFile -PathType Leaf)) {
    throw "Expected credential file at $credentialFile. Create only the documented non-secret file link before starting this task."
  }
}

# Resolve the actual clean-root Windows path with the reviewed helper. It
# normalizes backslashes before invoking wslpath and gives actionable failures.
$wslPathResolver = Join-Path $PSScriptRoot "resolve-wsl-path.ps1"
$wslProjectRoot = & $wslPathResolver -WindowsPath $projectRoot -Distribution $Distribution

# Do not start Compose dependencies here. dashboard and worker normally depend
# on migrate; --no-deps keeps migrations a separate, owner-approved action.
$startCommand = "docker compose -p openreply --env-file .env.local -f docker-compose.local.yml up -d --build --no-deps dashboard worker cron"

while ($true) {
  & wsl.exe -d $Distribution --cd $wslProjectRoot -- bash -lc "$startCommand && exec sleep infinity"
  Start-Sleep -Seconds $RetrySeconds
}
