import supertest from 'supertest';
import { createApp } from '../app.js';

let appInstance;

async function getApp() {
    if (!appInstance) {
        appInstance = await createApp();
    }
    return appInstance;
}

export async function createAgent() {
    const app = await getApp();
    return supertest.agent(app);
}

export async function createRequest() {
    const app = await getApp();
    return supertest(app);
}

let userCounter = 0;
export function generateUser() {
    userCounter++;
    const ts = Date.now();
    return {
        fullName: `Test User ${userCounter}`,
        email: `testuser_${userCounter}_${ts}@test.com`,
        password: 'TestPass123!',
        phone: `+201${String(ts).slice(-9)}`
    };
}

export async function createSellerAgent() {
    const agent = await createAgent();
    const user = generateUser();
    await agent.post('/api/auth/register').send(user);
    await agent.post('/api/auth/login').send({ email: user.email, password: user.password });

    // Submit seller application
    await agent.post('/api/user/become-seller').send({
        businessName: 'Test Business',
        businessType: 'Agency',
        nationalId: '29901011234567'
    });

    // Admin approves
    const adminAgent = await createAgent();
    await adminAgent.post('/api/auth/login').send({
        email: 'admin@3akarati.com',
        password: 'Admin123!'
    });

    // Get user ID from admin users list
    const usersRes = await adminAgent.get(`/api/admin/users?search=${user.email}`);
    const userId = usersRes.body.users[0]?.id;
    if (userId) {
        await adminAgent.post(`/api/admin/seller-requests/${userId}/approve`);
    }

    // Re-login to refresh session role
    await agent.post('/api/auth/login').send({ email: user.email, password: user.password });

    return { agent, user };
}
