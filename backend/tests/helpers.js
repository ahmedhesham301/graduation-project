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
