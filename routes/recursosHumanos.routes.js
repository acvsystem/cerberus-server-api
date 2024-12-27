import { Router } from 'express';
const router = Router();
import { generarCodigo } from '../controllers/csPapeletas.js';

router.post('/pap/gen_codigo_pap', generarCodigo);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes