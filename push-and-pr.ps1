# Push and prepare for PR (run from stellar-snaps root)
# Usage: .\push-and-pr.ps1   or   pwsh -File push-and-pr.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$branch = "feature-ui-updates"

Write-Host "=== Git status ===" -ForegroundColor Cyan
git status
Write-Host ""

# Ensure we're on the feature branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -eq "main") {
    Write-Host "Creating branch: $branch" -ForegroundColor Yellow
    git checkout -b $branch
} elseif ($currentBranch -ne $branch) {
    Write-Host "Current branch is: $currentBranch. Switch to $branch? (y/n)" -ForegroundColor Yellow
    $r = Read-Host
    if ($r -eq "y") { git checkout $branch }
}

Write-Host "=== Staging all changes ===" -ForegroundColor Cyan
git add .
git status
Write-Host ""

$msg = @"
feat(web): UI updates - developers hub, wallet flow, favicon, navbar

- Developers: wallet connection page with grid/glow background, API Key Creation card
- Developers hub: API Keys & Application ID page (product cards, Project/Keys/ID sections)
- Wallet flow: 'Connected. Wrong wallet? Change Wallet', no grey card on grid bg
- Developer hub: reddish-orange faded/blurred grid, scroll-based header animation
- Navbar: consistent on developers, hub, api-keys pages; initial transparent style
- Favicon: use stellardark.png for browser tab
- Hub header: wallet address + orange gradient Disconnect button, sticky scroll animation
"@

Write-Host "=== Commit ===" -ForegroundColor Cyan
git commit -m $msg
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed (maybe nothing to commit?). Check git status." -ForegroundColor Red
    exit 1
}

Write-Host "=== Push to origin ($branch) ===" -ForegroundColor Cyan
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Check remote and branch name." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done. Open a PR against upstream:" -ForegroundColor Green
Write-Host "  https://github.com/0xsoydev/stellar-snaps/compare/main...wajiha-kulsum:stellar-snaps:$branch" -ForegroundColor White
Write-Host "See PUSH_AND_PR.md for full steps." -ForegroundColor Gray
