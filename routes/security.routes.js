import { Router } from 'express';
const router = Router();
import { Login } from '../controllers/csSecurity.js';

router.post('/login', Login);
const securityRoutes = router;
export default securityRoutes