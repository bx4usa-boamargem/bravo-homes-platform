# Script usando a Management API do Supabase para executar SQL
# Esse endpoint requer o token de acesso pessoal (PAT), nao o service key


$serviceKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw"

# Ler o arquivo SQL
$sqlFile    = Join-Path $PSScriptRoot "setup_database.sql"
$sqlContent = [System.IO.File]::ReadAllText($sqlFile, [System.Text.Encoding]::UTF8)

Write-Host "Tamanho do SQL: $($sqlContent.Length) bytes"

# Quebrar em statements individuais e executar via PostgREST (pg_query nao existe)
# Alternativa: executar via funcao pg_catalog ou via endpoint de admin
# Como nao temos PAT, vamos tentar via PostgREST com service key usando função personalizada
# Ou fazer calls menores para tabelas individuais

Write-Host ""
Write-Host "=== Verificando se tabelas ja existem via PostgREST ==="

$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
}

$baseUrl = "https://qphhyflsukcnincdwxgr.supabase.co"

# Testar se tabela empresas existe
try {
    $null = Invoke-RestMethod `
        -Method GET `
        -Uri "$baseUrl/rest/v1/empresas?select=id&limit=1" `
        -Headers $headers `
        -ErrorAction Stop
    Write-Host "TABELA empresas: EXISTE" -ForegroundColor Green
} catch {
    Write-Host "TABELA empresas: NAO EXISTE" -ForegroundColor Red
}

# Testar tabela licitacoes_cache
try {
    $null = Invoke-RestMethod `
        -Method GET `
        -Uri "$baseUrl/rest/v1/licitacoes_cache?select=id_licitacao_gov&limit=1" `
        -Headers $headers `
        -ErrorAction Stop
    Write-Host "TABELA licitacoes_cache: EXISTE" -ForegroundColor Green
} catch {
    Write-Host "TABELA licitacoes_cache: NAO EXISTE" -ForegroundColor Red
}

# Testar tabela logs_disparo
try {
    $null = Invoke-RestMethod `
        -Method GET `
        -Uri "$baseUrl/rest/v1/logs_disparo?select=id&limit=1" `
        -Headers $headers `
        -ErrorAction Stop
    Write-Host "TABELA logs_disparo: EXISTE" -ForegroundColor Green
} catch {
    Write-Host "TABELA logs_disparo: NAO EXISTE" -ForegroundColor Red
}

# Testar tabela filtros_busca
try {
    $null = Invoke-RestMethod `
        -Method GET `
        -Uri "$baseUrl/rest/v1/filtros_busca?select=id&limit=1" `
        -Headers $headers `
        -ErrorAction Stop
    Write-Host "TABELA filtros_busca: EXISTE" -ForegroundColor Green
} catch {
    Write-Host "TABELA filtros_busca: NAO EXISTE" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fim da verificacao ==="
