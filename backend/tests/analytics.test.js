import { describe, it, expect, beforeAll } from 'vitest';
import { createAgent, createRequest, generateUser, createSellerAgent } from './helpers.js';

describe('Analytics Module', () => {
    let sellerAgent;

    beforeAll(async () => {
        const seller = await createSellerAgent();
        sellerAgent = seller.agent;
    });

    describe('GET /api/seller/analytics', () => {
        it('TC-ANA-01: should return seller analytics', async () => {
            const res = await sellerAgent.get('/api/seller/analytics');
            expect(res.status).toBe(200);
        });

        it('TC-ANA-05: should reject access for non-seller', async () => {
            const buyerAgent = await createAgent();
            const buyer = generateUser();

            await buyerAgent.post('/api/auth/register').send(buyer);
            await buyerAgent.post('/api/auth/login').send({
                email: buyer.email,
                password: buyer.password
            });

            const res = await buyerAgent.get('/api/seller/analytics');
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/analytics/seller/properties', () => {
        it('TC-ANA-02: should return seller property analytics', async () => {
            const res = await sellerAgent.get('/api/analytics/seller/properties');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/analytics/market-trends', () => {
        it('TC-ANA-03: should return market trends (public)', async () => {
            const request = await createRequest();
            const res = await request.get('/api/analytics/market-trends');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/analytics/seller-performance', () => {
        it('TC-ANA-04: should return seller performance', async () => {
            const res = await sellerAgent.get('/api/analytics/seller-performance');
            expect(res.status).toBe(200);
        });
    });
});
