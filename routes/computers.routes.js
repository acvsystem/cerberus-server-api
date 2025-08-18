import { Router } from 'express';
const router = Router();
import computersController from '../controllers/csComputers.js';

router.get('/all', computersController.allComputers);

const computerRoutes = router;
export default computerRoutes