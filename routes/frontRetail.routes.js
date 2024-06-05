import { Router } from 'express';
const router = Router();
import frontRetailController from '../controllers/csFrontRetail.js';

router.post('/search/configuration/agente', frontRetailController.onAgenteConfigList);

const frontRetailRoutes = router;
export default frontRetailRoutes