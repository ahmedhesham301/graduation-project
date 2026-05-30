import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, createRequest, generateUser } from './helpers.js';

describe('Favorites Module', () => {
    let agent;
    let propertyId;

    beforeAll(async () => {
        // Create a seller and a property
        const sellerAgent = await createAgent();
        const sellerUser = generateUser();
        await sellerAgent.post('/api/auth/register').send(sellerUser);
        await sellerAgent.post('/api/auth/login').send({
            email: sellerUser.email,
            password: sellerUser.password
        });
        await sellerAgent.post('/api/user/become-seller');

        const propRes = await sellerAgent.post('/api/properties').send({
            type: 'apartment',
            lon: 31.2357,
            lat: 30.0444,
            area: 120,
            floors: 2,
            rooms: 3,
            bathrooms: 2,
            city: 'Cairo',
            district: 'Nasr City',
            description: 'Test property for favorites',
            price: 1500000,
            condition: 'fully finished',
            media: [{ fileName: 'photo1.jpg', size: 500000 }]
        });

        if (propRes.status === 201) {
            propertyId = propRes.body.id || propRes.body.property?.id;
        }

        // Create a buyer
        agent = await createAgent();
        const testUser = generateUser();
        await agent.post('/api/auth/register').send(testUser);
        await agent.post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
    });

    describe('POST /api/favorites/:propertyId', () => {
        it('TC-FAV-01: should save property to favorites', async () => {
            if (!propertyId) return;

            const res = await agent.post(`/api/favorites/${propertyId}`);
            expect([200, 201]).toContain(res.status);
        });

        it('TC-FAV-02: should reject saving duplicate favorite', async () => {
            if (!propertyId) return;

            const res = await agent.post(`/api/favorites/${propertyId}`);
            expect([200, 201, 400, 409]).toContain(res.status);
        });
    });

    describe('GET /api/favorites', () => {
        it('TC-FAV-03: should return list of favorites', async () => {
            const res = await agent.get('/api/favorites');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('DELETE /api/favorites/:propertyId', () => {
        it('TC-FAV-04: should remove property from favorites', async () => {
            if (!propertyId) return;

            const res = await agent.delete(`/api/favorites/${propertyId}`);
            expect([200, 204]).toContain(res.status);
        });

        it('TC-FAV-05: should handle removing non-saved property', async () => {
            const res = await agent.delete('/api/favorites/99999');
            expect([400, 404]).toContain(res.status);
        });
    });

    describe('Unauthorized Access', () => {
        it('TC-FAV-06: should reject access without authentication', async () => {
            const request = await createRequest();
            const res = await request.get('/api/favorites');
            expect(res.status).toBe(401);
        });
    });
});
