import { Router } from 'express';
const router = Router();
import { onStock, onAgenteConfigList } from '../controllers/csFrontRetail.js';

router.post('/search/configuration/agente', onAgenteConfigList);
router.post('/search/stock', onStock);

const frontRetailRoutes = router;
export default frontRetailRoutes