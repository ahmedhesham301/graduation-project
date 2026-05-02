import { Router } from "express";
import { register, login, upgradeTOSeller, logout , getMe, updateMe  } from "../controllers/userController.js";
import { validateLoginBody, validateRegisterBody } from "../middlewares/validation/authValidator.js";
import { validateUpdateUser } from "../middlewares/validation/userValidator.js"
import { isAuthenticated } from "../middlewares/session.js"

const router = Router();

router.post('/auth/register', validateRegisterBody, register)
router.post('/auth/login', validateLoginBody, login)
router.post('/auth/logout', isAuthenticated, logout)
router.post('/auth/become-seller', isAuthenticated, upgradeTOSeller)
router.get('/user/me', isAuthenticated, getMe)
router.patch('/user/me', isAuthenticated, validateUpdateUser, updateMe)

export default router;