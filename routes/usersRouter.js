import { Router } from "express";
import { register } from "../controllers/userController.js";
import { validateBody } from "../middleware/validation/authValidator.js";
const router = Router();

router.post('/auth/register', validateBody, register)
// router.post('/auth/login', login)

export default router;