import { Router } from 'express';
const router = Router();
import securityController from '../controllers/csSecurity_new.js';

router.get('/session/login/all', securityController.allSessionLogin);
router.get('/session/auth/all', securityController.allSessionAuth);
router.get('/users/all', securityController.allUser);
router.delete('/session/auth', securityController.delAuthorization);
router.post('/users/all', securityController.inUser);
router.post('/users/all', securityController.updUser);

const securityRoutes = router;
export default securityRoutes 