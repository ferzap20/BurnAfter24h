import { Router } from 'express';
import { createMessage, getMessages, getMessageById } from '../controllers/messageController';
import { postMessageLimiter } from '../middleware/rateLimit';
import { detectCountry } from '../middleware/ipGeolocation';
import { hashIp } from '../middleware/ipHash';
import { filterContent } from '../middleware/contentFilter';

const router = Router();

router.post('/', hashIp, detectCountry, postMessageLimiter, filterContent, createMessage);
router.get('/', getMessages);
router.get('/:id', getMessageById);

export default router;
