import { Router } from 'express';
const router = Router();
import configurationController from '../controllers/csConfiguration';

router.get('/client/list/clear', configurationController.clearClient);
router.post('/client/list/clear', configurationController.inClearClient);

const configurationRoutes = router;
export default configurationRoutes