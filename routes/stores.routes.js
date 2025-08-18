import { Router } from 'express';
const router = Router();
import storesController from '../controllers/csStores.js';

router.get('/all', storesController.allStores, async (req, res) => {
    console.log(req);
});

const storesRoutes = router;
export default storesRoutes