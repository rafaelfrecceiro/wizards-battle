param([switch]$Rede)
$ErrorActionPreference = 'Stop'
$wbSource = Join-Path $PSScriptRoot 'src'
$wbReservePort = 4185
$wbReserveHealth = $null
try { $wbReserveHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$wbReservePort/api/health" -TimeoutSec 2 } catch {}
if ($wbReserveHealth) {
    if ($wbReserveHealth.appVersion -ne '0.9.0') { throw 'Porta 4185 ocupada por outra versão. Preserve a sessão existente.' }
    Write-Host "Energia acumulada já iniciada: http://127.0.0.1:$wbReservePort. A instância foi preservada."
    return
}
if (Get-NetTCPConnection -LocalPort $wbReservePort -State Listen -ErrorAction SilentlyContinue) { throw 'Porta 4185 ocupada. Nenhuma sessão será encerrada.' }
Write-Host 'A 0.9 histórica está desligada. Iniciando a versão atual em outra porta e banco.'
& (Join-Path $PSScriptRoot 'Iniciar-Feedback-Visual.ps1') -Rede:$Rede
