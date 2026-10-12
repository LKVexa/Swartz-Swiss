$ErrorActionPreference = 'Stop'
# The legacy IExpress launcher has no independent payload pin and used destructive AppData
# cache replacement. Fail closed; the .NET bootstrap authenticates its embedded payload.
Write-Error 'Legacy IExpress extraction is disabled. Build with Build-Single-EXE-DotNet-Only.cmd, or launch the preserved app with app\Launch-DF-VM-Technical-Institute.cmd. No payload was extracted or cache replaced.'
exit 1
