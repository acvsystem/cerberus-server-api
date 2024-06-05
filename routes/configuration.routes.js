import { Router } from 'express';
const router = Router();
import configurationController from '../controllers/csConfiguration.js';

router.post('/service/email', configurationController.saveServiceEmail);
router.post('/service/email/delete', configurationController.deleteSendEmail);
router.post('/service/email/save', configurationController.saveSendEmail);
router.get('/service/email/sendList', configurationController.onlistConfiguration);
router.post('/service/email/sendTest', configurationController.sendTestEmail);
router.post('/service/email/register', configurationController.sendLinkRegister);
router.get('/service/lista/menu', configurationController.onListMenu);
router.post('/service/registrar/menu', configurationController.onRegitrarMenu);
router.post('/service/delete/menu', configurationController.onDeleteMenu);
router.post('/service/lista/menu/user', configurationController.onListMenuUser);
router.get('/service/lista/perfil/user', configurationController.onListPerfilUser);

router.get('/service/lista/departamento', configurationController.onDepartametosList);
router.get('/service/lista/provincia', configurationController.onProvinciasList);
router.get('/service/lista/distrito', configurationController.onDistritoList);

router.get('/service/lista/roles', configurationController.onListRoles);

const configurationRoutes = router;
export default configurationRoutes