import { Router } from "express";
import { searchForProperty } from "../controllers/searchController.js";
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";

const router = Router();

router.get('/search', validateSearchQuery, searchForProperty)

export default router;