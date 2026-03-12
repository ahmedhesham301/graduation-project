import { Router } from "express";
import { register, login } from "../controllers/userController.js";
import { validateLoginBody, validateRegisterBody } from "../middlewares/validation/authValidator.js";

const router = Router();

router.post('/auth/register', validateRegisterBody, register)
router.post('/auth/login', validateLoginBody, login)

export default router;