import { Router } from 'express';
const router = Router();
import { generarCodigo, regHorasExtras } from '../controllers/csPapeletas.js';

router.post('/pap/gen_codigo_pap', generarCodigo);
router.post('/pap/horas_extras', regHorasExtras);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes