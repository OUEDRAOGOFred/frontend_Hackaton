const request = require('supertest');
const app = require('../src/app');

describe('Notification Email', () => {
  it('should send an email notification to a user', async () => {
    // Connexion admin pour récupérer le token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'ChangeMe@2025!' });
    const token = loginRes.body.accessToken;

    // Envoi de la notification email
    const res = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 1, message: 'Test email automatique', type: 'email' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });
});
