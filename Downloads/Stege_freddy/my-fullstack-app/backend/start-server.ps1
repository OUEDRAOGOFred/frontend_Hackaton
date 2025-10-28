# Script de démarrage propre du serveur
Write-Host "🔄 REDÉMARRAGE PROPRE DU SERVEUR" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Arrêter TOUS les processus Node.js
Write-Host "`n📌 Étape 1: Arrêt de tous les processus Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Processus trouvés: $($nodeProcesses.Count)" -ForegroundColor Gray
    taskkill /f /im node.exe 2>$null
    Write-Host "   ✅ Tous les processus Node.js ont été arrêtés" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Aucun processus Node.js en cours" -ForegroundColor Gray
}

# 2. Attendre que les processus se terminent complètement
Write-Host "`n📌 Étape 2: Attente de la libération du port..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "   ✅ Port libéré" -ForegroundColor Green

# 3. Vérifier le fichier server-final.js
Write-Host "`n📌 Étape 3: Vérification du fichier serveur..." -ForegroundColor Yellow
$serverPath = "c:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend\server-final.js"
if (Test-Path $serverPath) {
    $fileSize = (Get-Item $serverPath).Length
    Write-Host "   ✅ Fichier trouvé: server-final.js ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
    
    # Vérifier que les routes existent dans le fichier
    $content = Get-Content $serverPath -Raw
    if ($content -match "app\.get\('/api/sessions'") {
        Write-Host "   ✅ Route /api/sessions trouvée dans le code" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Route /api/sessions NON trouvée!" -ForegroundColor Red
    }
    
    if ($content -match "app\.get\('/api/notifications/emails'") {
        Write-Host "   ✅ Route /api/notifications/emails trouvée dans le code" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Route /api/notifications/emails NON trouvée!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ ERREUR: Fichier serveur non trouvé!" -ForegroundColor Red
    exit 1
}

# 4. Démarrer le serveur
Write-Host "`n📌 Étape 4: Démarrage du serveur..." -ForegroundColor Yellow
Set-Location "c:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend"
Write-Host "   📂 Répertoire: $(Get-Location)" -ForegroundColor Gray
Write-Host "`n" + "=" * 60
Write-Host "🚀 LANCEMENT DU SERVEUR..." -ForegroundColor Cyan
Write-Host "=" * 60 + "`n"

node server-final.js
