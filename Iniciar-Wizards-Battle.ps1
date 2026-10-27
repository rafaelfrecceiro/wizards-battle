param([switch]$Rede)
& (Join-Path $PSScriptRoot 'Iniciar-Edicao-Completa.ps1') -Rede:$Rede
