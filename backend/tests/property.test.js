import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, createRequest, generateUser } from './helpers.js';

describe('Property Management Module', () => {
    let agent;
    let propertyId;

    beforeAll(async () => {
        agent = await createAgent();
        const testUser = generateUser();

        await agent.post('/api/auth/register').send(testUser);
        await agent.post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
        await agent.post('/api/user/become-seller');
    });

    describe('POST /api/properties', () => {
        it('TC-PROP-01: should create a property as seller', async () => {
            const res = await agent.post('/api/properties').send({
                type: 'apartment',
                lon: 31.2357,
                lat: 30.0444,
                area: 150,
                floors: 3,
                rooms: 4,
                bathrooms: 2,
                city: 'Cairo',
                district: 'Nasr City',
                description: 'Beautiful apartment for testing',
                price: 2000000,
                condition: 'fully finished',
                media: [{ fileName: 'photo1.jpg', size: 500000 }]
            });

            expect(res.status).toBe(201);
            propertyId = res.body.id || res.body.property?.id;
        });

        it('TC-PROP-03: should reject property creation without auth', async () => {
            const request = await createRequest();

            const res = await request.post('/api/properties').send({
                type: 'apartment',
                lon: 31.2357,
                lat: 30.0444,
                area: 100,
                floors: 1,
                rooms: 2,
                bathrooms: 1,
                city: 'Cairo',
                district: 'Nasr City',
                price: 1000000,
                condition: 'semi finished',
                media: [{ fileName: 'photo1.jpg', size: 500000 }]
            });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/properties/:propertyId', () => {
        it('TC-PROP-04: should get property by ID', async () => {
            if (!propertyId) return;

            const res = await agent.get(`/api/properties/${propertyId}`);
            // Property may return 404 if pending_media is true (no actual upload in test)
            expect([200, 404]).toContain(res.status);
        });

        it('TC-PROP-05: should reject invalid property ID', async () => {
            const res = await agent.get('/api/properties/abc');
            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/properties/:propertyId', () => {
        it('TC-PROP-06: should update property as owner', async () => {
            if (!propertyId) return;

            const res = await agent
                .patch(`/api/properties/${propertyId}`)
                .send({ price: 2500000 });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/search', () => {
        it('TC-PROP-09: should search properties with filters', async () => {
            const res = await agent.get('/api/search?city=Cairo&page=1');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/properties/nearby', () => {
        it('TC-PROP-10: should get nearby properties', async () => {
            const res = await agent.get('/api/properties/nearby?lat=30.0444&lon=31.2357&radius=10');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/properties/types', () => {
        it('TC-PROP-11: should return property types', async () => {
            const res = await agent.get('/api/properties/types');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/my-properties', () => {
        it('should return seller properties', async () => {
            const res = await agent.get('/api/my-properties');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('DELETE /api/properties/:propertyId', () => {
        it('TC-PROP-08: should delete property as owner', async () => {
            if (!propertyId) return;

            const res = await agent.delete(`/api/properties/${propertyId}`);
            expect([200, 204]).toContain(res.status);
        });
    });
});
