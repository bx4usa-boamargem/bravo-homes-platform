# Script para executar o setup_database.sql via API REST do Supabase
$supabaseUrl = "https://qphhyflsukcnincdwxgr.supabase.co"
$serviceKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw"

# Ler o arquivo SQL
$sqlFile = Join-Path $PSScriptRoot "setup_database.sql"
$sqlContent = [System.IO.File]::ReadAllText($sqlFile, [System.Text.Encoding]::UTF8)

# Montar o payload JSON
$body = @{ query = $sqlContent } | ConvertTo-Json -Depth 3 -Compress

# Cabeçalhos
$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
}

Write-Host "Executando SQL no Supabase..."
Write-Host "Tamanho do SQL:" $sqlContent.Length "bytes"

try {
    $response = Invoke-RestMethod `
        -Method POST `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "SUCESSO:" ($response | ConvertTo-Json -Depth 3)
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusDescription
    Write-Host "ERRO HTTP $statusCode - $statusDesc"
    
    try {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhe:" $errorBody
    } catch {
        Write-Host "Resposta de erro:" $_.Exception.Message
    }
}
