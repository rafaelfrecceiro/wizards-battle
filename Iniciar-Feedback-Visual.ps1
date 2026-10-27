param([switch]$Rede)
$ErrorActionPreference = 'Stop'
$wbSource = Join-Path $PSScriptRoot 'src'
$wbReservePort = 4186
$wbReserveHealth = $null
try { $wbReserveHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$wbReservePort/api/health" -TimeoutSec 2 } catch {}
if ($wbReserveHealth) {
    if ($wbReserveHealth.appVersion -ne '0.10.0') { throw 'Porta 4186 ocupada por outra versão. Preserve a sessão existente.' }
    Write-Host "Feedback visual já iniciado: http://127.0.0.1:$wbReservePort. A instância foi preservada."
    return
}
if (Get-NetTCPConnection -LocalPort $wbReservePort -State Listen -ErrorAction SilentlyContinue) { throw 'Porta 4186 ocupada. Nenhuma sessão será encerrada.' }
Write-Host 'A versão histórica 0.10 não está em execução. Iniciando a edição completa em banco separado na 4187.'
& (Join-Path $PSScriptRoot 'Iniciar-Edicao-Completa.ps1') -Rede:$Rede
return
