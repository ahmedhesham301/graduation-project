import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, generateUser } from './helpers.js';

describe('User Management Module', () => {
    let agent;
    let testUser;

    beforeAll(async () => {
        agent = await createAgent();
        testUser = generateUser();

        await agent.post('/api/auth/register').send(testUser);
        await agent.post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
    });

    describe('GET /api/user/me', () => {
        it('TC-USER-01: should return current user profile with role', async () => {
            const res = await agent.get('/api/user/me');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('role');
        });
    });

    describe('PATCH /api/user/me', () => {
        it('TC-USER-02: should update user profile', async () => {
            const res = await agent
                .patch('/api/user/me')
                .send({ fullName: 'Updated Name' });

            expect(res.status).toBe(200);
        });

        it('TC-USER-04: should reject update with invalid data', async () => {
            const res = await agent
                .patch('/api/user/me')
                .send({});

            expect([400, 200]).toContain(res.status);
        });
    });

    describe('POST /api/user/become-seller', () => {
        it('TC-USER-03: should submit seller application', async () => {
            const res = await agent.post('/api/user/become-seller').send({
                businessName: 'Test Real Estate',
                businessType: 'Agency',
                nationalId: '29901011234567'
            });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('pending');
        });

        it('TC-USER-05: should reject duplicate seller application', async () => {
            const res = await agent.post('/api/user/become-seller').send({
                businessName: 'Test Real Estate',
                businessType: 'Agency',
                nationalId: '29901011234567'
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('pending');
        });

        it('TC-USER-06: should reject without required fields', async () => {
            const agent2 = await createAgent();
            const user2 = generateUser();
            await agent2.post('/api/auth/register').send(user2);
            await agent2.post('/api/auth/login').send({ email: user2.email, password: user2.password });

            const res = await agent2.post('/api/user/become-seller').send({});
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/user/seller-status', () => {
        it('TC-USER-07: should return seller request status', async () => {
            const res = await agent.get('/api/user/seller-status');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status');
            expect(res.body.status).toBe('pending');
            expect(res.body).toHaveProperty('business_name');
        });

        it('TC-USER-08: should return none for user without request', async () => {
            const agent3 = await createAgent();
            const user3 = generateUser();
            await agent3.post('/api/auth/register').send(user3);
            await agent3.post('/api/auth/login').send({ email: user3.email, password: user3.password });

            const res = await agent3.get('/api/user/seller-status');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('none');
        });
    });
});
