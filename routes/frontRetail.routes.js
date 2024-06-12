import { Router } from 'express';
const router = Router();
import { onStock } from '../controllers/csFrontRetail.js';

//router.post('/search/configuration/agente', frontRetailController.onAgenteConfigList);
router.post('/search/stock', onStock);

const frontRetailRoutes = router;
export default frontRetailRoutes