import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, generateUser } from './helpers.js';

describe('Authentication Module', () => {
    let agent;
    let testUser;

    beforeAll(async () => {
        agent = await createAgent();
        testUser = generateUser();
    });

    describe('POST /api/auth/register', () => {
        it('TC-AUTH-01: should register a new user successfully', async () => {
            const res = await agent
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('User registered successfully');
        });

        it('TC-AUTH-02: should reject registration with existing email', async () => {
            const res = await agent
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already exists');
        });

        it('TC-AUTH-03: should reject registration with invalid email', async () => {
            const res = await agent
                .post('/api/auth/register')
                .send({
                    fullName: 'Test User',
                    email: 'notanemail',
                    password: 'TestPass123!'
                });

            expect(res.status).toBe(400);
        });

        it('TC-AUTH-04: should reject registration with short password', async () => {
            const res = await agent
                .post('/api/auth/register')
                .send({
                    fullName: 'Test User',
                    email: 'short@test.com',
                    password: '123'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('TC-AUTH-05: should login successfully with valid credentials', async () => {
            const res = await agent
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('login successful');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('role');
        });

        it('TC-AUTH-06: should reject login with wrong password', async () => {
            const res = await agent
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid password');
        });

        it('TC-AUTH-07: should reject login with non-existent email', async () => {
            const res = await agent
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'TestPass123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Email not found');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('TC-AUTH-08: should logout successfully', async () => {
            // Login first
            await agent
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            const res = await agent.post('/api/auth/logout');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('logout successful');
        });
    });

    describe('Protected Routes', () => {
        it('TC-AUTH-09: should reject access to protected route without login', async () => {
            const { createRequest } = await import('./helpers.js');
            const request = await createRequest();

            const res = await request.get('/api/user/me');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Not authenticated');
        });
    });
});
