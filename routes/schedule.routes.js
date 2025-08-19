import { Router } from 'express';
const router = Router();
import scheduleController from '../controllers/csSchedule.js';

router.get('/all', scheduleController.allSchedule);
router.post('/schedule/generate', scheduleController.generateSchedule);
router.get('/schedule/search', scheduleController.searchSchedule);
router.post('/schedule/range', scheduleController.inRange);
router.put('/schedule/range', scheduleController.updRange);
router.post('/schedule/day/work', scheduleController.inDayWork);
router.delete('/schedule/day/work', scheduleController.delDayWork);
router.post('/schedule/day/free', scheduleController.inDayFree);
router.delete('/schedule/day/free', scheduleController.delDayFree);
router.post('/schedule/observation', scheduleController.inObservation);
router.put('/schedule/observation', scheduleController.updObservation);
router.delete('/schedule/observation', scheduleController.delObservation);
router.post('/schedule/register', scheduleController.registerSchedule);

const scheduleRoutes = router;
export default scheduleRoutes 