
import { Router } from "express";
import { 
    getAllProperties, 
    getPropertyById, 
    createProperty 
} from "../controllers/propertycontroller.js";

const router = Router()


router.get("/", getAllProperties)
router.get("/:id", getPropertyById)
router.post("/", createProperty)

export default router