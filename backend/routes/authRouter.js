import { Router } from "express";
import { register, login, logout, getCurrentUser, updateCurrentUser  } from "../controllers/userController.js";
import { validateLoginBody, validateRegisterBody } from "../middlewares/validation/authValidator.js";
import { isAuthenticated } from "../middlewares/session.js"

const router = Router();

router.post('/auth/register', validateRegisterBody, register)
router.post('/auth/login', validateLoginBody, login)
router.post('/auth/logout', isAuthenticated, logout)

export default router;