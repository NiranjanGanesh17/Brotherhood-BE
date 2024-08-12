import express from 'express';
import { VisibilityToggle } from '../controllers/userController.js';
import {authenticateJWT} from '../middlewares/auth.middleware.js'

const router = express.Router();

router.patch('/visibility-toggle',authenticateJWT,VisibilityToggle)

export default router