import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, generateUser } from './helpers.js';

describe('Admin Dashboard Module', () => {
    let adminAgent;
    let buyerAgent;
    let testBuyer;

    beforeAll(async () => {
        // Login as admin
        adminAgent = await createAgent();
        await adminAgent.post('/api/auth/login').send({
            email: 'admin@3akarati.com',
            password: 'Admin123!'
        });

        // Create a buyer for testing
        buyerAgent = await createAgent();
        testBuyer = generateUser();
        await buyerAgent.post('/api/auth/register').send(testBuyer);
        await buyerAgent.post('/api/auth/login').send({
            email: testBuyer.email,
            password: testBuyer.password
        });
    });

    describe('GET /api/admin/stats', () => {
        it('TC-ADM-01: should return dashboard stats', async () => {
            const res = await adminAgent.get('/api/admin/stats');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total_users');
            expect(res.body).toHaveProperty('total_buyers');
            expect(res.body).toHaveProperty('total_sellers');
            expect(res.body).toHaveProperty('total_properties');
            expect(res.body).toHaveProperty('sold_properties');
            expect(res.body).toHaveProperty('new_users_30d');
            expect(res.body).toHaveProperty('new_properties_30d');
            expect(res.body).toHaveProperty('total_contacts');
        });

        it('TC-ADM-02: should reject non-admin access', async () => {
            const res = await buyerAgent.get('/api/admin/stats');
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/admin/recent', () => {
        it('TC-ADM-03: should return recent users and properties', async () => {
            const res = await adminAgent.get('/api/admin/recent');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(res.body).toHaveProperty('properties');
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(Array.isArray(res.body.properties)).toBe(true);
        });
    });

    describe('GET /api/admin/users', () => {
        it('TC-ADM-04: should list all users with pagination', async () => {
            const res = await adminAgent.get('/api/admin/users?page=1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('totalPages');
        });

        it('TC-ADM-05: should filter users by role', async () => {
            const res = await adminAgent.get('/api/admin/users?role=admin');
            expect(res.status).toBe(200);
            res.body.users.forEach(user => {
                expect(user.role).toBe('admin');
            });
        });

        it('TC-ADM-06: should search users by name', async () => {
            const res = await adminAgent.get(`/api/admin/users?search=${testBuyer.fullName.split(' ')[0]}`);
            expect(res.status).toBe(200);
            expect(res.body.users.length).toBeGreaterThan(0);
        });
    });

    describe('PATCH /api/admin/users/:id/role', () => {
        it('TC-ADM-07: should change user role', async () => {
            const usersRes = await adminAgent.get(`/api/admin/users?search=${testBuyer.email}`);
            const userId = usersRes.body.users[0]?.id;
            if (!userId) return;

            const res = await adminAgent.patch(`/api/admin/users/${userId}/role`).send({ role: 'buyer' });
            expect(res.status).toBe(200);
            expect(res.body.role).toBe('buyer');
        });

        it('TC-ADM-08: should reject invalid role', async () => {
            const res = await adminAgent.patch('/api/admin/users/1/role').send({ role: 'invalid' });
            expect(res.status).toBe(400);
        });
    });

    describe('System Settings Module', () => {
        it('TC-ADM-17: should return site settings', async () => {
            const res = await adminAgent.get('/api/admin/settings');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('site_name');
            expect(res.body).toHaveProperty('maintenance_mode');
        });

        it('TC-ADM-18: should update site settings', async () => {
            const res = await adminAgent.patch('/api/admin/settings').send({
                settings: { site_name: 'Test Platform', maintenance_mode: 'true' }
            });
            expect(res.status).toBe(200);
            
            const checkRes = await adminAgent.get('/api/admin/settings');
            expect(checkRes.body.site_name).toBe('Test Platform');
            expect(checkRes.body.maintenance_mode).toBe('true');
        });
    });

    describe('Property Moderation Module', () => {
        let propertyId;

        beforeAll(async () => {
            // Create a property to moderate
            const propRes = await adminAgent.post('/api/properties').send({
                type: 'apartment',
                lon: 31.2357,
                lat: 30.0444,
                area: 100,
                floors: 1,
                rooms: 2,
                bathrooms: 1,
                city: 'Cairo',
                district: 'Maadi',
                description: 'To be moderated',
                price: 1000000,
                condition: 'fully finished'
            });
            propertyId = propRes.body.id;
        });

        it('TC-ADM-19: should approve a property listing', async () => {
            if (!propertyId) return;
            const res = await adminAgent.post(`/api/admin/properties/${propertyId}/approve`);
            expect(res.status).toBe(200);
            
            const propRes = await adminAgent.get(`/api/admin/properties/${propertyId}`);
            expect(propRes.body.moderation_status).toBe('approved');
        });

        it('TC-ADM-20: should reject a property listing with reason', async () => {
            if (!propertyId) return;
            const res = await adminAgent.post(`/api/admin/properties/${propertyId}/reject`).send({
                reason: 'Incomplete photos'
            });
            expect(res.status).toBe(200);
            
            const propRes = await adminAgent.get(`/api/admin/properties/${propertyId}`);
            expect(propRes.body.moderation_status).toBe('rejected');
            expect(propRes.body.rejection_reason).toBe('Incomplete photos');
        });
    });

    describe('Advanced Analytics Module', () => {
        it('TC-ADM-21: should return expanded analytics data', async () => {
            const res = await adminAgent.get('/api/admin/reports');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('leadMethods');
            expect(res.body).toHaveProperty('topProperties');
            expect(res.body).toHaveProperty('offerStatuses');
            expect(res.body).toHaveProperty('timeToSell');
            expect(res.body).toHaveProperty('sellers');
            expect(Array.isArray(res.body.leadMethods)).toBe(true);
            expect(Array.isArray(res.body.sellers)).toBe(true);
        });
    });

    describe('GET /api/admin/contacts', () => {
        it('TC-ADM-12: should return contact events', async () => {
            const res = await adminAgent.get('/api/admin/contacts?page=1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('events');
        });
    });

    describe('GET /api/admin/activity-log', () => {
        it('TC-ADM-14: should return activity log', async () => {
            const res = await adminAgent.get('/api/admin/activity-log?page=1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('logs');
        });
    });
});
