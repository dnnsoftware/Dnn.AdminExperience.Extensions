Param(
    [parameter(Mandatory=$true )][string]$SrcDir,
    [parameter(Mandatory=$false)][string]$filterBy = "package.json"
    )

function DnnWriteLog($obj)
{
    Write-Host "$(Get-Date) => $obj"
}

$exitCode = 0

try {
    
    Push-Location
    
    if( !(Test-Path $SrcDir)) {
        $exitCode = 1
        Write-Error "Folder [$SrcDir] does not exist"
    }
    else {
        Write-Output "############# Looking for files in $SrcDir #############"
        $files = Get-ChildItem $SrcDir -Recurse -Filter $filterBy | Where-Object {-not ($_.PSIsContainer) -and $_.FullName -notmatch 'node_modules' }
        $files | ForEach {
            $file = $_.Fullname

            Set-Location $_.Directory.FullName

            DnnWriteLog "Processing file $file"
            
            DnnWriteLog "Running: yarn install"
            yarn install
            $exitCode = $LASTEXITCODE
            if ($exitCode -ne 0) { throw "NPM error - exit code = $exitCode" }
            
            DnnWriteLog "Running: yarn run build"
            $result = yarn run build
            $exitCode = $LASTEXITCODE

            Write-Output $result
            if ($result -match "Module build failed:") {
                throw "NPM error - failed to build module"
            }

            if ($result -match "Module not found: Error:") {
                throw "NPM error - compile error"
            }

            if ($exitCode -ne 0) {
                throw "NPM error - exit code = $exitCode"
            }
        }
    }
} catch {
    Write-Error $error[0]
    $exitCode = 3
} finally {
    Pop-Location
}

exit $exitCode
