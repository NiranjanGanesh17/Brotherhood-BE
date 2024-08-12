import express from 'express';
import { discordAuth,discordRedirectAuth,getUser } from '../controllers/authController.js';
import {authenticateJWT} from '../middlewares/auth.middleware.js'

const router = express.Router()

  router.get('/discord/callback', discordRedirectAuth);

  router.get('/discord', discordAuth);

  router.get('/user',authenticateJWT,getUser)

  export default router