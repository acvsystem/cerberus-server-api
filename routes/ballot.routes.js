import { Router } from 'express';
const router = Router();
import ballotController from '../controllers/csBallot.js';

router.get('/all', ballotController.allBallot);
router.get('/type/all', ballotController.allType);
router.get('/authorization/all', ballotController.allAuthorization);

const ballotRoutes = router;
export default ballotRoutes