import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, generateUser } from './helpers.js';

describe('Security Features', () => {
    let agent;

    beforeAll(async () => {
        agent = await createAgent();
    });

    describe('Password Complexity Validation', () => {
        it('should reject registration with password lacking lowercase', async () => {
            const user = generateUser();
            user.password = 'TESTPASS123!';
            const res = await agent.post('/api/auth/register').send(user);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid input format');
        });

        it('should reject registration with password lacking uppercase', async () => {
            const user = generateUser();
            user.password = 'testpass123!';
            const res = await agent.post('/api/auth/register').send(user);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid input format');
        });

        it('should reject registration with password lacking number', async () => {
            const user = generateUser();
            user.password = 'TestPassWord!';
            const res = await agent.post('/api/auth/register').send(user);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid input format');
        });

        it('should reject registration with password lacking special character', async () => {
            const user = generateUser();
            user.password = 'TestPassWord123';
            const res = await agent.post('/api/auth/register').send(user);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid input format');
        });
    });

    describe('Account Lockout Policy', () => {
        it('should lock user out after 5 failed login attempts', async () => {
            const user = generateUser();
            // Register user first
            await agent.post('/api/auth/register').send(user);

            // 4 failed attempts
            for (let i = 0; i < 4; i++) {
                const res = await agent.post('/api/auth/login').send({
                    email: user.email,
                    password: 'WrongPassword123!'
                });
                expect(res.status).toBe(400);
                expect(res.body.error).toContain('Invalid password');
            }

            // 5th failed attempt should lock the account
            const res5 = await agent.post('/api/auth/login').send({
                email: user.email,
                password: 'WrongPassword123!'
            });
            expect(res5.status).toBe(403);
            expect(res5.body.error).toContain('locked');

            // 6th attempt (even with correct password) should be blocked
            const res6 = await agent.post('/api/auth/login').send({
                email: user.email,
                password: user.password
            });
            expect(res6.status).toBe(403);
            expect(res6.body.error).toContain('locked');
        });
    });

    describe('Security Audit Logs API', () => {
        it('should return security logs for admin', async () => {
            const adminAgent = await createAgent();
            // Login as admin
            await adminAgent.post('/api/auth/login').send({
                email: 'admin@3akarati.com',
                password: 'Admin123!'
            });

            const res = await adminAgent.get('/api/admin/security-logs');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('logs');
            expect(Array.isArray(res.body.logs)).toBe(true);
        });

        it('should reject security logs access for non-admin', async () => {
            const userAgent = await createAgent();
            const user = generateUser();
            await userAgent.post('/api/auth/register').send(user);
            await userAgent.post('/api/auth/login').send({ email: user.email, password: user.password });

            const res = await userAgent.get('/api/admin/security-logs');
            expect(res.status).toBe(403);
        });

        it('should reject security logs access for unauthenticated users', async () => {
            const unauthAgent = await createAgent();
            const res = await unauthAgent.get('/api/admin/security-logs');
            expect(res.status).toBe(401);
        });
    });
});
