# Creates desktop and Start-menu shortcuts. Run again after moving the folder.
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'file:///' + ($dir -replace '\\', '/') + '/index.html'
$profileDir = Join-Path $env:LOCALAPPDATA 'ClinicalMicrobiologyApp'
$candidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$browser = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
$name = 'میکروب‌شناسی بالینی تشخیصی.lnk'
$targets = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))
$shell = New-Object -ComObject WScript.Shell
foreach ($t in $targets) {
  $s = $shell.CreateShortcut((Join-Path $t $name))
  if ($browser) {
    $s.TargetPath = $browser
    $s.Arguments = "--app=`"$url`" --user-data-dir=`"$profileDir`" --no-first-run --no-default-browser-check --window-size=1400,900"
  } else {
    $s.TargetPath = Join-Path $dir 'index.html'
  }
  $s.WorkingDirectory = $dir
  $s.IconLocation = (Join-Path $dir 'assets\icon\icon.ico')
  $s.Description = 'Clinical Microbiology - interactive handbook'
  $s.Save()
}
Write-Host 'Shortcut created on the Desktop and in the Start menu.'
