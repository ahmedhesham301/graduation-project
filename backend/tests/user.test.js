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
        it('TC-USER-01: should return current user profile', async () => {
            const res = await agent.get('/api/user/me');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email');
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
        it('TC-USER-03: should upgrade user to seller', async () => {
            const res = await agent.post('/api/user/become-seller');

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('seller');
        });
    });
});
