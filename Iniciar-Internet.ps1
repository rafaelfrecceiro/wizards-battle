param([int]$Porta = 4187)
$ErrorActionPreference = 'Stop'
$wbSource = Join-Path $PSScriptRoot 'src'
$wbLogs = Join-Path $PSScriptRoot 'logs'
$wbTunnel = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../tools/cloudflared/cloudflared.exe'))
New-Item -ItemType Directory -Force -Path $wbLogs | Out-Null
if (-not (Test-Path -LiteralPath $wbTunnel)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $wbTunnel) | Out-Null
    Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/download/2026.10.3/cloudflared-windows-amd64.exe' -OutFile $wbTunnel
}
if ((Get-FileHash -LiteralPath $wbTunnel -Algorithm SHA256).Hash.ToLowerInvariant() -ne '76b2805253d0d6ffacb092a7acfbee99e7af6917835c0c5410e23f3ef5052da2') {
    throw 'cloudflared difere da versão verificada 2026.10.3; preserve o arquivo e confira a origem.'
}
$wbHealth = $null
try { $wbHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$Porta/api/health" -TimeoutSec 2 } catch {}
if ($wbHealth -and $wbHealth.appVersion -notin @('0.7.0','0.8.0','0.9.0','0.10.0','0.11.0')) { throw 'A porta pertence a outra versão; preserve a sessão existente.' }
if (-not $wbHealth) {
    if ($Porta -ne 4187) { throw 'Para iniciar a versão atual use a porta 4187. As portas anteriores preservam as versões históricas.' }
    if (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue) { throw 'Porta ocupada; nenhuma sessão será encerrada.' }
    Push-Location -LiteralPath $wbSource
    try {
        if (-not (Test-Path -LiteralPath 'node_modules')) { npm ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci falhou.' } }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Build falhou.' }
        $env:WB_PORT = "$Porta"
        $env:WB_HOST = '0.0.0.0'
        $env:WB_SAVE_PATH = Join-Path $PSScriptRoot 'saves/rooms-terras-complete-v1.sqlite'
        Start-Process -FilePath (Get-Command node).Source -ArgumentList 'node_modules/tsx/dist/cli.mjs','server/index.ts','--production' -WorkingDirectory $wbSource -WindowStyle Hidden -RedirectStandardOutput (Join-Path $wbLogs 'servidor.stdout.log') -RedirectStandardError (Join-Path $wbLogs 'servidor.stderr.log') | Out-Null
    } finally { Pop-Location }
    for ($wbAttempt = 0; $wbAttempt -lt 60; $wbAttempt++) {
        try { $wbHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$Porta/api/health" -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $wbHealth) { throw 'Servidor não iniciou. Confira logs/.' }
}
Write-Host "Local: http://127.0.0.1:$Porta"
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { Write-Host "Rede local: http://$($_.IPAddress):$Porta" }
Write-Host 'Abra o endereço HTTPS abaixo para criar a sala e compartilhar seu convite. O link muda ao reiniciar o túnel; mantenha esta janela aberta.'
& $wbTunnel tunnel --url "http://127.0.0.1:$Porta" --no-autoupdate
