import { Router } from 'express';
const router = Router();
import storesController from '../controllers/csStores.js';

router.get('/all', storesController.allStores);
router.get('/terminals/all', storesController.allStoresTerminals);

const storesRoutes = router;
export default storesRoutes