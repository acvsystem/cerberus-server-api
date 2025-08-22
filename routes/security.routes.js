import { Router } from 'express';
const router = Router();
import securityController from '../controllers/csSecurity.js';
import csToken from '../controllers/csToken.js';

router.post('/login', securityController.login);
router.get('/inventaryEmail', securityController.allInventoryEmail);
router.get('/parameter/store', securityController.allParameterStore);//lista/tienda
router.post('/create/hash/plugin', securityController.genHashPlugin);//create/hash/agente
router.get('/download/file', securityController.downloadFile);//download
router.get('/session/login/all', securityController.allSessionLogin);
router.get('/session/auth/all', securityController.allSessionAuth);
router.get('/users/all', csToken.verifyToken, securityController.allUser);
router.delete('/session/auth', securityController.delAuthorization);
router.post('/users/all', securityController.inUser);
router.put('/users/all', securityController.updUser);

const securityRoutes = router;
export default securityRoutes