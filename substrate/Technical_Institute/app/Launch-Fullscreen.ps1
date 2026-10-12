$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'Launch-DF-VM-Technical-Institute.ps1') -Fullscreen
exit $LASTEXITCODE
