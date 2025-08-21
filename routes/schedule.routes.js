import { Router } from 'express';
const router = Router();
import scheduleController from '../controllers/csSchedule.js';

router.get('/all', scheduleController.allSchedule);
router.post('/generate', scheduleController.generateSchedule);
router.get('/search', scheduleController.searchSchedule);
router.post('/range', scheduleController.inRange);
router.put('/range', scheduleController.updRange);
router.post('/day/work', scheduleController.inDayWork);
router.delete('/day/work', scheduleController.delDayWork);
router.post('/day/free', scheduleController.inDayFree);
router.delete('/day/free', scheduleController.delDayFree);
router.post('/observation', scheduleController.inObservation);
router.put('/observation', scheduleController.updObservation);
router.delete('/observation', scheduleController.delObservation);
router.post('/register', scheduleController.registerSchedule);

const scheduleRoutes = router;
export default scheduleRoutes 