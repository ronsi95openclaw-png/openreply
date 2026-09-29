param(
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$WindowsPath,
  [ValidateNotNullOrEmpty()]
  [string]$Distribution = "Ubuntu"
)

$ErrorActionPreference = "Stop"

# PowerShell's native-command argument handling can otherwise remove path
# backslashes before WSL receives them. Give wslpath an absolute, slash-form
# Windows path and keep its output untouched until its process result is known.
$windowsPathForWsl = [System.IO.Path]::GetFullPath($WindowsPath).Replace("\", "/")
$wslPathOutput = & wsl.exe -d $Distribution -- wslpath -a -- "$windowsPathForWsl" 2>&1
$wslExitCode = $LASTEXITCODE

if ($wslExitCode -ne 0) {
  $diagnostic = ($wslPathOutput | Out-String)
  throw "Could not convert Windows path '$windowsPathForWsl' with wslpath in distribution '$Distribution' (exit code $wslExitCode). $diagnostic"
}

if ($null -eq $wslPathOutput) {
  throw "wslpath returned no output while converting Windows path '$windowsPathForWsl' in distribution '$Distribution'."
}

$wslPath = ($wslPathOutput | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($wslPath)) {
  throw "wslpath returned an empty path while converting Windows path '$windowsPathForWsl' in distribution '$Distribution'."
}

Write-Output $wslPath
