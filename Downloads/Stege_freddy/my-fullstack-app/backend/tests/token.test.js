const request = require('supertest');
const app = require('../src/app');

describe('Token Endpoints', () => {
    it('should award tokens to a user', async () => {
        // You need a valid JWT for this test
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'ChangeMe@2025!' });
        const token = loginRes.body.accessToken;

        const res = await request(app)
            .post('/api/tokens/award')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: 1, type: 'quiz', value: 10 });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });
});
