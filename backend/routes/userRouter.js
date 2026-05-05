import { Router } from "express";
import { isAuthenticated } from "../middlewares/session.js"
import { upgradeTOSeller, getCurrentUser, updateCurrentUser } from "../controllers/userController.js";
import { validateUpdateUser } from "../middlewares/validation/userValidator.js"



const router = Router()

router.post('/user/become-seller', isAuthenticated, upgradeTOSeller)
router.get('/user/me', isAuthenticated, getCurrentUser)
router.patch('/user/me', isAuthenticated, validateUpdateUser, updateCurrentUser)

export default router;