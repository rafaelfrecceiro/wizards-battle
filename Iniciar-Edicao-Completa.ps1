param([switch]$Rede)
$ErrorActionPreference = 'Stop'
$wbSource = Join-Path $PSScriptRoot 'src'
$wbCompletePort = 4187
$wbCompleteHealth = $null
try { $wbCompleteHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$wbCompletePort/api/health" -TimeoutSec 2 } catch {}
if ($wbCompleteHealth) {
    if ($wbCompleteHealth.appVersion -ne '0.11.0') { throw 'Porta 4187 ocupada por outra versão. Preserve a sessão existente.' }
    Write-Host "As Terras Despertas já iniciada: http://127.0.0.1:$wbCompletePort. A instância foi preservada."
    return
}
if (Get-NetTCPConnection -LocalPort $wbCompletePort -State Listen -ErrorAction SilentlyContinue) { throw 'Porta 4187 ocupada. Nenhuma sessão será encerrada.' }
Push-Location -LiteralPath $wbSource
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as dependências.' }
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Build interrompido.' }
    $env:WB_PORT = "$wbCompletePort"
    $env:WB_SAVE_PATH = Join-Path $PSScriptRoot 'saves/rooms-terras-complete-v1.sqlite'
    $env:WB_HOST = if ($Rede) { '0.0.0.0' } else { '127.0.0.1' }
    Write-Host "Abra http://127.0.0.1:$wbCompletePort. As Terras Despertas completa: 60 cartas e seis decks novos."
    Write-Host 'As versões anteriores e suas partidas permanecem separadas.'
    npm start
} finally { Pop-Location }
