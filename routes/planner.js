import express from 'express';
import {askQuestion,postKinds,getKinds} from '../controllers/planController.js'

const router = express.Router();

router.post('/ask',askQuestion)
router.post('/post-kinds',postKinds)
router.get('/get-kinds',getKinds)
export default router