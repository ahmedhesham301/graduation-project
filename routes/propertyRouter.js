
// Purpose: Express router for "properties" using the controller layer

import { Router } from "express";
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  listPropertyMedia,
  addPropertyMedia,
  listPropertyFeatures,
  addPropertyFeature,
  removePropertyFeature,
  validatePropertyBody,
} from "../controllers/propertycontroller.js";

const router = Router();

// Collection
router.get("/", listProperties);
router.post("/", validatePropertyBody, createProperty);

// Single resource
router.get("/:id", getProperty);
router.put("/:id", validatePropertyBody, updateProperty);
router.delete("/:id", deleteProperty);

// Media
router.get("/:id/media", listPropertyMedia);
router.post("/:id/media", addPropertyMedia);

// Features
router.get("/:id/features", listPropertyFeatures);
router.post("/:id/features", addPropertyFeature);
router.delete("/:id/features/:featureId", removePropertyFeature);

export default router;