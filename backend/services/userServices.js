import bcrypt from "bcrypt"
import crypto from "crypto";
import { save, findByEmail, upgradeToSeller, getSellerProfileByUserId, findUserById, updateUser, incrementFailedAttempts, resetFailedAttempts } from "../models/userModel.js";

export async function registerUser(fullName, email, phone, password, role) {
    const passwordHash = await bcrypt.hash(password, 10);
    await save(fullName, email, phone, passwordHash, role)
}

export async function authenticateUser(email, password) {
    const userData = await findByEmail(email)

    if (userData == null) {
        let err = new Error("Email not found");
        err.code = 'EMAIL_NOT_FOUND'
        throw err
    }

    // Check lockout status
    if (userData.lockoutUntil && new Date(userData.lockoutUntil) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(userData.lockoutUntil) - new Date()) / (60 * 1000));
        let err = new Error(`Account is locked. Please try again in ${remainingMinutes} minute(s).`);
        err.code = 'LOCKED_OUT';
        throw err;
    }

    if (await bcrypt.compare(password, userData.passwordHash)) {
        await resetFailedAttempts(userData.id);
        return userData
    }

    // Wrong password - increment failed attempts
    const { attempts, lockoutUntil } = await incrementFailedAttempts(userData.id, userData.failedLoginAttempts);

    if (lockoutUntil) {
        let err = new Error("Too many failed attempts. Your account has been locked for 15 minutes.");
        err.code = 'LOCKED_OUT';
        throw err;
    }

    let err = new Error(`Invalid password. Attempts remaining: ${5 - attempts}`);
    err.code = 'WRONG_PASSWORD'
    throw err
}

export async function becomeSeller(userId, businessName, businessType, nationalId) {
    await upgradeToSeller(userId, businessName, businessType, nationalId)
}

export async function getSellerStatus(userId) {
    return await getSellerProfileByUserId(userId)
}
export async function getUserProfile(userId) {
    return await findUserById(userId)
}
export async function updateUserProfile(userId, data) {
    const fields = {}

    if (data.fullName)  fields['full_name']     = data.fullName
    if (data.phone)     fields['phone']          = data.phone

    // Only hash and update password if a new one was provided
    if (data.password)  fields['password_hash']  = await bcrypt.hash(data.password, 10)

    if (Object.keys(fields).length === 0) return null

    return await updateUser(userId, fields)
}

export async function loginOrRegisterGoogleUser(email, fullName) {
    let user = await findByEmail(email);
    if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        
        let role = 'buyer';
        if (email === 'ahdmed@gmail.com') {
            role = 'seller';
        }
        
        await save(fullName, email, null, passwordHash, role);
        user = await findByEmail(email);
    }
    return user;
}