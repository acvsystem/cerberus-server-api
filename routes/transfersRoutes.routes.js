import { Router } from 'express';
const router = Router();
import transfersController from '../controllers/csTransfers.js';

router.get('/all', transfersController.allTransfers);
router.get('/search/detail', transfersController.searchDetailsTransfers);
router.post('/new', transfersController.inTransfers);

const transfersRoutes = router;
export default transfersRoutes