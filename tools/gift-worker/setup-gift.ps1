# Itgyeol gift-photo storage setup (Cloudflare Worker + Workers KV, free, no card needed)
# 1) Cloudflare login in the browser  2) create KV storage  3) deploy the worker  4) put its URL into the app
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$repo = Resolve-Path (Join-Path $here '..\..')
Set-Location $here

Write-Host ''
Write-Host '[1/4] Cloudflare login - a browser window opens. Log in (or sign up for free) and press Allow.' -ForegroundColor Cyan
npx --yes wrangler@4 login
if ($LASTEXITCODE -ne 0) { throw 'LOGIN FAILED' }

Write-Host ''
Write-Host '[2/4] Creating KV storage (photos are deleted automatically after 24 hours)' -ForegroundColor Cyan
$toml = Get-Content -Raw -Encoding UTF8 wrangler.toml
if ($toml -match 'KV_ID_HERE') {
  $out = (npx --yes wrangler@4 kv namespace create GIFTS 2>&1 | Out-String)
  Write-Host $out
  $m = [regex]::Match($out, '([0-9a-f]{32})')
  if (-not $m.Success) {
    $list = (npx --yes wrangler@4 kv namespace list 2>&1 | Out-String)
    $m = [regex]::Match($list, '"id":\s*"([0-9a-f]{32})"[^}]*"title":\s*"[^"]*GIFTS')
    if (-not $m.Success) { throw 'Could not read the KV id. Tell Claude.' }
  }
  $toml = $toml -replace 'KV_ID_HERE', $m.Groups[1].Value
  [IO.File]::WriteAllText((Join-Path $here 'wrangler.toml'), $toml)
  Write-Host ('KV id: ' + $m.Groups[1].Value)
} else {
  Write-Host 'KV already set - skipping.'
}

Write-Host ''
Write-Host '[3/4] Deploying the worker. If it asks for a workers.dev subdomain, type any short English name and press Enter.' -ForegroundColor Cyan
npx --yes wrangler@4 deploy
if ($LASTEXITCODE -ne 0) { throw 'DEPLOY FAILED' }

# Worker URL: https://itgyeol-gift.<subdomain>.workers.dev  (read the subdomain through the Cloudflare API with wrangler's login)
$url = $null
try {
  $who = (npx --yes wrangler@4 whoami 2>&1 | Out-String)
  $acc = [regex]::Match($who, '([0-9a-f]{32})').Groups[1].Value
  $cfgs = @(
    (Join-Path $env:APPDATA 'xdg.config\.wrangler\config\default.toml'),
    (Join-Path $env:USERPROFILE '.wrangler\config\default.toml'),
    (Join-Path $env:USERPROFILE '.config\.wrangler\config\default.toml')
  )
  $cfg = $cfgs | Where-Object { Test-Path $_ } | Select-Object -First 1
  $tok = [regex]::Match((Get-Content -Raw $cfg), 'oauth_token\s*=\s*"([^"]+)"').Groups[1].Value
  $r = Invoke-RestMethod -Headers @{ Authorization = "Bearer $tok" } -Uri "https://api.cloudflare.com/client/v4/accounts/$acc/workers/subdomain"
  if ($r.result.subdomain) { $url = "https://itgyeol-gift.$($r.result.subdomain).workers.dev" }
} catch { }
if (-not $url) {
  $url = Read-Host 'Copy the https://itgyeol-gift....workers.dev address shown above, paste it here and press Enter'
}
$url = $url.Trim().TrimEnd('/')
if ($url -notmatch '^https://[a-z0-9.-]+\.workers\.dev$') { throw ('Strange address: ' + $url) }
Write-Host ('Worker: ' + $url)

Write-Host ''
Write-Host '[4/4] Putting the address into the app' -ForegroundColor Cyan
$f = Join-Path $repo 'src\components\SurpriseGift.js'
$js = [IO.File]::ReadAllText($f)
$js = [regex]::Replace($js, "export const GIFT_UPLOAD_URL = '[^']*';", "export const GIFT_UPLOAD_URL = '$url';")
[IO.File]::WriteAllText($f, $js)
Write-Host 'Done. The "QR to my phone" button is now on.' -ForegroundColor Green
