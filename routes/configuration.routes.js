import { Router } from 'express';
const router = Router();
import configurationController from '../controllers/csConfiguration.js';

router.get('/client/list/clear', configurationController.clearClient);
router.post('/client/list/clear', configurationController.inClearClient);
router.get('/plugin/sunat', configurationController.pluginSunat);
router.get('/menu/all', configurationController.AllMenu);
router.get('/level/all', configurationController.AllLevel);
router.post('/menu', configurationController.inMenu);
router.get('/menu/search', configurationController.searchMenu);
router.post('/level', configurationController.inLevel);
router.post('/menu/permission', configurationController.inPermissionMenu);
router.delete('/menu/permission', configurationController.delPermissionMenu);
router.post('/asignation/store', configurationController.inAsignationStore);
router.delete('/asignation/store', configurationController.delAsignationStore);
router.get('/asignation/store', configurationController.searchAsignationStore);

const configurationRoutes = router;
export default configurationRoutes