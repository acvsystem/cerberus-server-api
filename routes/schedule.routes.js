import { Router } from 'express';
const router = Router();
import scheduleController from '../controllers/csSchedule.js';

router.get('/notify', scheduleController.notifyExitDialing);

const scheduleRoutes = router;
export default scheduleRoutes