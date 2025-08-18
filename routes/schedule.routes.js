import { Router } from 'express';
const router = Router();
import scheduleController from '../controllers/csSchedule.js';

router.get('/all', scheduleController.allSchedule);

const scheduleRoutes = router;
export default scheduleRoutes