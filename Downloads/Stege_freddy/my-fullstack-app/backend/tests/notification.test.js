const request = require('supertest');
const app = require('../src/app');

describe('Notification Endpoints', () => {
    it('should send an email notification', async () => {
        // You need a valid JWT for this test
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'ChangeMe@2025!' });
        const token = loginRes.body.accessToken;

        const res = await request(app)
            .post('/api/notifications/send')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: 1, message: 'Test notification', type: 'email' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });
});
