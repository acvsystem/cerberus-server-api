import { Router } from 'express';
const router = Router();
import scheduleController from '../controllers/csSchedule.js';

router.get('/notify', scheduleController.notifyExitDialing);
router.get('/limit/register', scheduleController.allLimitRegister);

const scheduleRoutes = router;
export default scheduleRoutes