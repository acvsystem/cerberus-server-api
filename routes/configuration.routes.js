import { Router } from 'express';
const router = Router();
import configurationController from '../controllers/csConfiguration.js';

router.post('/service/email', configurationController.saveServiceEmail);
router.post('/service/email/delete', configurationController.deleteSendEmail);
router.post('/service/email/save', configurationController.saveSendEmail);
router.get('/service/email/sendList', configurationController.onlistConfiguration);
router.post('/service/email/sendTest', configurationController.sendTestEmail);
router.post('/service/email/register', configurationController.sendLinkRegister);
router.post('/service/lista/menu', configurationController.onListMenu);

const configurationRoutes = router;
export default configurationRoutes