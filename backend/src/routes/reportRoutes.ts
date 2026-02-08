import { Router } from 'express';
import { createReport } from '../controllers/reportController';
import { reportLimiter } from '../middleware/rateLimit';
import { hashIp } from '../middleware/ipHash';

const router = Router();

router.post('/', hashIp, reportLimiter, createReport);

export default router;
