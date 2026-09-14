<#
Install (or uninstall) these skills into your user-scope Claude Code config.
  .\install.ps1              interactive install, defaults to all skills
  .\install.ps1 -Uninstall   interactive uninstall
Skills go to ~\.claude\skills\<name>\; any agents\*.md a skill carries go to
~\.claude\agents\. Existing copies are overwritten.
#>
[CmdletBinding()]
param([switch]$Uninstall)

$ErrorActionPreference = 'Stop'
$RepoDir     = $PSScriptRoot
$SkillsDest  = Join-Path $env:USERPROFILE '.claude\skills'
$AgentsDest  = Join-Path $env:USERPROFILE '.claude\agents'

# Discover skills: any top-level dir containing a SKILL.md.
$skills = Get-ChildItem -Path $RepoDir -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') } |
  Select-Object -ExpandProperty Name
if ($skills.Count -eq 0) { Write-Error "No skills found in $RepoDir"; exit 1 }

$action = if ($Uninstall) { 'Uninstall' } else { 'Install' }
Write-Host "$action which skills?"
for ($i = 0; $i -lt $skills.Count; $i++) {
  Write-Host ("  {0}) {1}" -f ($i + 1), $skills[$i])
}
$reply = Read-Host "Enter numbers (comma-separated), or 'all' [all]"
if ([string]::IsNullOrWhiteSpace($reply)) { $reply = 'all' }

$selected = @()
if ($reply -eq 'all') {
  $selected = $skills
} else {
  foreach ($p in ($reply -split '[,\s]+' | Where-Object { $_ })) {
    if ($p -match '^\d+$' -and [int]$p -ge 1 -and [int]$p -le $skills.Count) {
      $selected += $skills[[int]$p - 1]
    } else {
      Write-Warning "Ignoring invalid choice: $p"
    }
  }
}
if ($selected.Count -eq 0) { Write-Host 'Nothing selected.'; exit 0 }

foreach ($skill in $selected) {
  $agentsSrc = Join-Path $RepoDir "$skill\agents"
  $skillDest = Join-Path $SkillsDest $skill
  if ($Uninstall) {
    if (Test-Path $skillDest) { Remove-Item -Recurse -Force $skillDest }
    if (Test-Path $agentsSrc) {
      Get-ChildItem -Path $agentsSrc -Filter '*.md' | ForEach-Object {
        $dst = Join-Path $AgentsDest $_.Name
        if (Test-Path $dst) { Remove-Item -Force $dst }
      }
    }
    Write-Host "Uninstalled $skill"
  } else {
    New-Item -ItemType Directory -Force -Path $SkillsDest, $AgentsDest | Out-Null
    if (Test-Path $skillDest) { Remove-Item -Recurse -Force $skillDest }
    Copy-Item -Recurse -Force (Join-Path $RepoDir $skill) $skillDest
    if (Test-Path $agentsSrc) {
      Get-ChildItem -Path $agentsSrc -Filter '*.md' |
        Copy-Item -Destination $AgentsDest -Force
    }
    Write-Host "Installed $skill"
  }
}
