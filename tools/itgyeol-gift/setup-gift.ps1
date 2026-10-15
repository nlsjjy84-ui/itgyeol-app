# Itgyeol gift-photo storage setup (Vercel Functions + Vercel Blob, uses your existing Vercel account)
# 1) Vercel login in the browser  2) create the project  3) create photo storage  4) deploy  5) put its URL into the app
$ErrorActionPreference = 'Continue'
$here = $PSScriptRoot
$repo = Resolve-Path (Join-Path $here '..\..')
Set-Location $here
$V = 'vercel@64.2.0'

Write-Host ''
Write-Host '[1/5] Vercel login - a browser window opens. Log in the same way as for Vouchsafe (e.g. Continue with GitHub) and confirm.' -ForegroundColor Cyan
npx --yes $V whoami | Out-Null
if ($LASTEXITCODE -ne 0) {
  npx --yes $V login
  if ($LASTEXITCODE -ne 0) { throw 'LOGIN FAILED' }
}

Write-Host ''
Write-Host '[2/5] Creating the project itgyeol-gift' -ForegroundColor Cyan
npx --yes $V link --yes
if ($LASTEXITCODE -ne 0) { throw 'LINK FAILED' }

Write-Host ''
Write-Host '[3/5] Creating photo storage (photos are deleted after 24 hours)' -ForegroundColor Cyan
$stores = (npx --yes $V blob list-stores 2>&1 | Out-String)
if ($stores -match 'itgyeol-gift-photos') {
  Write-Host 'Storage already exists - skipping.'
} else {
  npx --yes $V blob create-store itgyeol-gift-photos --access public --yes
  if ($LASTEXITCODE -ne 0) { throw 'STORAGE FAILED' }
}

Write-Host ''
Write-Host '[4/5] Deploying' -ForegroundColor Cyan
$out = (npx --yes $V deploy --prod --yes 2>&1 | Out-String)
Write-Host $out
if ($LASTEXITCODE -ne 0) { throw 'DEPLOY FAILED' }
# Use the public production domain (deployment-specific URLs can be login-protected)
$url = $null
$m = [regex]::Match($out, 'Aliased:\s*(https://[a-z0-9.-]+\.vercel\.app)')
if ($m.Success) { $url = $m.Groups[1].Value }
if (-not $url) {
  $ls = (npx --yes $V project ls 2>&1 | Out-String)
  $m = [regex]::Match($ls, 'itgyeol-gift\s+(https://[a-z0-9.-]+\.vercel\.app)')
  if ($m.Success) { $url = $m.Groups[1].Value }
}
if (-not $url) {
  $url = Read-Host 'Copy the https://itgyeol-gift....vercel.app address shown above (Aliased / Production), paste it here and press Enter'
}
$url = $url.Trim().TrimEnd('/')
if ($url -notmatch '^https://[a-z0-9.-]+\.vercel\.app$') { throw ('Strange address: ' + $url) }
Write-Host ('Storage: ' + $url)

# Quick check: the storage answers from the internet
try {
  $r = Invoke-WebRequest -Uri ($url + '/gift') -Method Options -UseBasicParsing
  Write-Host ('Check OK (' + $r.StatusCode + ')')
} catch { throw ('The storage did not answer: ' + $_.Exception.Message) }

Write-Host ''
Write-Host '[5/5] Putting the address into the app' -ForegroundColor Cyan
$f = Join-Path $repo 'src\components\SurpriseGift.js'
$js = [IO.File]::ReadAllText($f)
$js = [regex]::Replace($js, "export const GIFT_UPLOAD_URL = '[^']*';", "export const GIFT_UPLOAD_URL = '$url';")
[IO.File]::WriteAllText($f, $js)
Write-Host 'Done. The "QR to my phone" button is now on.' -ForegroundColor Green
