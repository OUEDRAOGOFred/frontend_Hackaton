const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'ChangeMe@2025!' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('should not login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'wrongpassword' });
        expect(res.statusCode).toEqual(401);
    });
});
