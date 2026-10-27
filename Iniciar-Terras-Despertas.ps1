param([switch]$Rede)
$ErrorActionPreference = 'Stop'
$wbSource = Join-Path $PSScriptRoot 'src'
$wbPilotPort = 4184
$wbPilotHealth = $null
try { $wbPilotHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$wbPilotPort/api/health" -TimeoutSec 2 } catch {}
if ($wbPilotHealth) {
    if ($wbPilotHealth.appVersion -ne '0.8.0') { throw 'Porta 4184 ocupada por outra versão. Preserve a sessão existente.' }
    Write-Host "Piloto já iniciado: http://127.0.0.1:$wbPilotPort. A instância foi preservada."
    return
}
if (Get-NetTCPConnection -LocalPort $wbPilotPort -State Listen -ErrorAction SilentlyContinue) { throw 'Porta 4184 ocupada. Nenhuma sessão será encerrada.' }
Write-Host 'A 0.8 histórica está desligada. O código atual inicia a 0.9 em outro banco/porta, também com as 12 cartas Terras.'
& (Join-Path $PSScriptRoot 'Iniciar-Energia-Acumulada.ps1') -Rede:$Rede
