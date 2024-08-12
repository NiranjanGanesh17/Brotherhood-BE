import express from 'express';
import {authenticateJWT} from '../middlewares/auth.middleware.js'
import { LocationVisibilityToggle, createNewLocation, getAllLocations } from '../controllers/locationController.js';
const router = express.Router();

router.post('/create',createNewLocation)
router.get('/', getAllLocations);
router.patch('/location-visibility-toggle',authenticateJWT,LocationVisibilityToggle)

export default router