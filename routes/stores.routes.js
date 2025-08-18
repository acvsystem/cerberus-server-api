import { Router } from 'express';
const router = Router();
import storesController from '../controllers/csStores.js';

router.get('/all', storesController.allStores);

const storesRoutes = router;
export default storesRoutes