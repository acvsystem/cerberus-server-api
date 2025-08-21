import { Router } from 'express';
const router = Router();
import storesController from '../controllers/csStores.js';

router.get('/all', storesController.allStores);
router.get('/terminals/all', storesController.allStoresTerminals);
router.post('/register', storesController.inStore);//add/registro/tiendas
router.post('/register/parameter', storesController.inParameterStore);//add/tienda;

const storesRoutes = router;
export default storesRoutes