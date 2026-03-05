import { Router } from "express";
import { register } from "../controllers/userController.js";
const router = Router();

router.post('/auth/register', register)
// router.post('/auth/login', login)

export default router;