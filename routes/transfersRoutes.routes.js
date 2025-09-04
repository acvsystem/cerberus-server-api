import { Router } from 'express';
const router = Router();
import transfersController from '../controllers/csTransfers.js';

router.post('/pap/gen_codigo_pap', generarCodigo);

const transfersRoutes = router;
export default transfersRoutes