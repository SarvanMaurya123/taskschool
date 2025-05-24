import express from 'express';
import { addSchool, listSchools } from '../controller/schoolinfo';

const router = express.Router();

router.post('/addSchool', addSchool);
router.get('/listSchools', listSchools);

export default router;


