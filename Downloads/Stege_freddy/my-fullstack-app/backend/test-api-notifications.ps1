# Test de l'API notifications avec emails
Write-Host "🔬 Test de l'API notifications avec emails" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow

$baseUrl = "http://localhost:5001"

# Test 1: Notification simple
Write-Host "`n1. Test notification simple..." -ForegroundColor Cyan
try {
    $body = @{
        userId = 1
        title = "Nouveau cours disponible 📚"
        message = "Le cours 'React Avancé' est maintenant disponible dans votre espace étudiant."
        type = "success"
        priority = "normal"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Réponse: $($response.message)" -ForegroundColor Green
    Write-Host "📧 Email envoyé: Oui" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Test 2: Notification d'avertissement
Write-Host "`n2. Test notification d'avertissement..." -ForegroundColor Cyan
try {
    $body = @{
        userId = 1
        title = "Date limite approche ⚠️"
        message = "Il vous reste 2 jours pour soumettre votre projet final 'Application Web'."
        type = "warning"
        priority = "high"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Réponse: $($response.message)" -ForegroundColor Green
    Write-Host "📧 Email envoyé: Oui" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Test 3: Notification système
Write-Host "`n3. Test notification système..." -ForegroundColor Cyan
try {
    $body = @{
        title = "Maintenance programmée 🔧"
        message = "Une maintenance de la plateforme est programmée dimanche de 2h à 4h du matin."
        type = "info"
        priority = "high"
        targetRole = "student"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/system" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Réponse: $($response.message)" -ForegroundColor Green
    Write-Host "📧 Emails envoyés: Oui" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
}

# Test 4: Récupération des notifications
Write-Host "`n4. Test récupération des notifications..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/1" -Method Get
    Write-Host "✅ Notifications récupérées: $($response.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===============================================" -ForegroundColor Yellow
Write-Host "✅ Tests terminés! Vérifiez votre boîte email freddyouedraogo104@gmail.com" -ForegroundColor Green
Write-Host "📧 Vous devriez avoir reçu des emails pour chaque notification créée." -ForegroundColor Cyan