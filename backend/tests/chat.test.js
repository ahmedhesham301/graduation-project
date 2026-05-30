import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, createRequest, generateUser } from './helpers.js';

describe('Chat Module', () => {
    let agent;

    beforeAll(async () => {
        agent = await createAgent();
        const testUser = generateUser();

        await agent.post('/api/auth/register').send(testUser);
        await agent.post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
    });

    describe('GET /api/chat/inbox', () => {
        it('TC-CHAT-03: should return inbox for authenticated user', async () => {
            const res = await agent.get('/api/chat/inbox');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('inbox');
            expect(Array.isArray(res.body.inbox)).toBe(true);
        });

        it('should reject inbox access without auth', async () => {
            const request = await createRequest();
            const res = await request.get('/api/chat/inbox');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/chat/messages', () => {
        it('TC-CHAT-05: should require authentication for messages', async () => {
            const request = await createRequest();
            const res = await request
                .post('/api/chat/messages')
                .send({
                    receiverId: 1,
                    propertyId: 1,
                    content: 'Hello'
                });

            expect(res.status).toBe(401);
        });
    });
});
