# Script de test d'intégration complet
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST D'INTEGRATION DE LA PLATEFORME" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$results = @()

# Fonction pour tester une route
function Test-Route {
    param($name, $url, $method = "GET", $body = $null)
    
    Write-Host "Testing: $name..." -NoNewline
    
    try {
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $url -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host " ✅ OK" -ForegroundColor Green
            return @{name=$name; status="✅ OK"; code=$response.StatusCode}
        }
    } catch {
        Write-Host " ❌ ECHEC" -ForegroundColor Red
        return @{name=$name; status="❌ ECHEC"; code=$_.Exception.Response.StatusCode.value__}
    }
}

# 1. AUTHENTIFICATION
Write-Host "`n1. SYSTEME D'AUTHENTIFICATION" -ForegroundColor Yellow
$results += Test-Route "Login étudiant" "$baseUrl/api/auth/login" "POST" @{email="etudiant@plateforme.edu"; password="password123"}
$results += Test-Route "Login professeur" "$baseUrl/api/auth/login" "POST" @{email="professeur@plateforme.edu"; password="password123"}
$results += Test-Route "Login admin" "$baseUrl/api/auth/login" "POST" @{email="admin@plateforme.edu"; password="password123"}

# 2. COURS
Write-Host "`n2. GESTION DES COURS" -ForegroundColor Yellow
$results += Test-Route "Liste des cours" "$baseUrl/api/courses"
$results += Test-Route "Cours par ID" "$baseUrl/api/courses/1"

# 3. DEVOIRS
Write-Host "`n3. GESTION DES DEVOIRS" -ForegroundColor Yellow
$results += Test-Route "Liste des devoirs" "$baseUrl/api/assignments"
$results += Test-Route "Devoirs par cours" "$baseUrl/api/assignments?courseId=1"

# 4. SOUMISSIONS
Write-Host "`n4. SOUMISSIONS DE DEVOIRS" -ForegroundColor Yellow
$results += Test-Route "Liste soumissions" "$baseUrl/api/submissions"
$results += Test-Route "Créer soumission" "$baseUrl/api/submissions" "POST" @{assignmentId=1; studentId=3; content="Test soumission"}

# 5. INSCRIPTIONS
Write-Host "`n5. INSCRIPTIONS AUX COURS" -ForegroundColor Yellow
$results += Test-Route "Liste inscriptions" "$baseUrl/api/enrollments"
$results += Test-Route "Inscriptions étudiant" "$baseUrl/api/enrollments?studentId=3"

# 6. NOTES
Write-Host "`n6. GESTION DES NOTES" -ForegroundColor Yellow
$results += Test-Route "Liste des notes" "$baseUrl/api/grades"

# 7. ANALYTIQUES
Write-Host "`n7. ANALYTIQUES ET STATISTIQUES" -ForegroundColor Yellow
$results += Test-Route "Stats générales" "$baseUrl/api/analytics/stats"
$results += Test-Route "Données graphiques" "$baseUrl/api/analytics/charts"
$results += Test-Route "Analytics enseignant" "$baseUrl/api/analytics/teacher/2"

# 8. SESSIONS SYNCHRONES
Write-Host "`n8. SESSIONS SYNCHRONES" -ForegroundColor Yellow
$results += Test-Route "Liste sessions" "$baseUrl/api/sessions"

# 9. NOTIFICATIONS
Write-Host "`n9. NOTIFICATIONS" -ForegroundColor Yellow
$results += Test-Route "Historique emails" "$baseUrl/api/notifications/emails"

# 10. UTILISATEURS
Write-Host "`n10. GESTION UTILISATEURS" -ForegroundColor Yellow
$results += Test-Route "Liste utilisateurs" "$baseUrl/api/users"

# RESUME
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$totalTests = $results.Count
$successTests = ($results | Where-Object {$_.status -eq "✅ OK"}).Count
$failedTests = $totalTests - $successTests

Write-Host "`nTotal tests: $totalTests" -ForegroundColor White
Write-Host "Réussis: $successTests" -ForegroundColor Green
Write-Host "Échoués: $failedTests" -ForegroundColor Red
Write-Host "`nTaux de réussite: $([math]::Round(($successTests/$totalTests)*100, 2))%" -ForegroundColor Cyan

# Afficher les détails
Write-Host "`nDETAILS:" -ForegroundColor White
foreach ($result in $results) {
    $color = if ($result.status -eq "✅ OK") {"Green"} else {"Red"}
    Write-Host "$($result.status) $($result.name) (Code: $($result.code))" -ForegroundColor $color
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
