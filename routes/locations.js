import express from 'express';
import { createNewLocation, getAllLocations } from '../controllers/locationController.js';
const router = express.Router();

router.post('/create',createNewLocation)
router.get('/', getAllLocations);

export default router