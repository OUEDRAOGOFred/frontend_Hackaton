console.log('🔧 Test rapide de l\'API depuis le frontend...');

// Test direct de l'API login
async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            },
            body: JSON.stringify({
                email: 'admin@plateforme.edu',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        console.log('✅ Réponse du serveur:', data);
        
        if (data.success) {
            console.log('✅ Connexion réussie!');
            console.log('📋 Utilisateur:', data.user.firstName, data.user.lastName);
            console.log('🔑 Token:', data.accessToken);
        } else {
            console.log('❌ Échec de connexion:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur de test:', error);
    }
}

testLogin();