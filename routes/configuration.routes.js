import { Router } from 'express';
const router = Router();
import configurationController from '../controllers/csConfiguration.js';

router.get('/client/list/clear', configurationController.clearClient);
router.get('/plugin/sunat', configurationController.pluginSunat);
router.get('/menu/all', configurationController.AllMenu);
router.get('/level/all', configurationController.AllLevel);

router.post('/client/list/clear', configurationController.inClearClient);
const configurationRoutes = router;
export default configurationRoutes