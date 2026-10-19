# Itgyeol server update: orders / exhibit / Toss TEST payments on the existing Vercel project (itgyeol-gift)
# 1) Vercel login check  2) Toss TEST keys (optional, test_ck_ / test_sk_ only)  3) deploy  4) check
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$V = 'vercel@64.2.0'

Write-Host ''
Write-Host '[server 1/4] Vercel login check' -ForegroundColor Cyan
npx --yes $V whoami | Out-Null
if ($LASTEXITCODE -ne 0) {
  npx --yes $V login
  if ($LASTEXITCODE -ne 0) { throw 'LOGIN FAILED' }
}
if (-not (Test-Path (Join-Path $PSScriptRoot '.vercel'))) {
  npx --yes $V link --yes --project itgyeol-gift
  if ($LASTEXITCODE -ne 0) { throw 'LINK FAILED' }
}

Write-Host ''
Write-Host '[server 2/4] Toss Payments TEST keys (same keys as AIRA). Press Enter on an empty line to skip (then mock payment stays).' -ForegroundColor Cyan
$ck = (Read-Host 'Client key (starts with test_ck_)').Trim()
if ($ck) {
  if (-not $ck.StartsWith('test_ck_')) { throw 'Only a TEST client key (test_ck_...) is allowed. Nothing was changed.' }
  $sec = Read-Host 'Secret key (starts with test_sk_, hidden while typing)' -AsSecureString
  $sk = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)).Trim()
  if (-not $sk.StartsWith('test_sk_')) { throw 'Only a TEST secret key (test_sk_...) is allowed. Nothing was changed.' }
  foreach ($pair in @(@('TOSS_CLIENT_KEY', $ck), @('TOSS_SECRET_KEY', $sk))) {
    npx --yes $V env rm $pair[0] production --yes 2>&1 | Out-Null
    $pair[1] | npx --yes $V env add $pair[0] production
    if ($LASTEXITCODE -ne 0) { throw ('SAVING ' + $pair[0] + ' FAILED') }
  }
  $sk = $null
  Write-Host 'Keys saved on Vercel only (not in the app, not in GitHub).' -ForegroundColor Green
} else {
  Write-Host 'Skipped - mock payment stays.'
}

Write-Host ''
Write-Host '[server 3/4] Deploying the server' -ForegroundColor Cyan
npx --yes $V deploy --prod --yes
if ($LASTEXITCODE -ne 0) { throw 'DEPLOY FAILED' }

Write-Host ''
Write-Host '[server 4/4] Checking' -ForegroundColor Cyan
$base = 'https://itgyeol-gift.vercel.app'
try {
  $o = Invoke-RestMethod -Uri ($base + '/api/orders') -UseBasicParsing
  Write-Host ('Orders OK (' + @($o.orders).Count + ' now)')
  $e = Invoke-RestMethod -Uri ($base + '/api/exhibit') -UseBasicParsing
  Write-Host ('Exhibit OK (' + @($e.entries).Count + ' now)')
  $p = Invoke-RestMethod -Uri ($base + '/api/pay') -UseBasicParsing
  if ($p.clientKey) { Write-Host 'Toss TEST payment ON' -ForegroundColor Green } else { Write-Host 'Toss payment OFF (mock payment)' }
} catch { throw ('The server did not answer: ' + $_.Exception.Message) }
