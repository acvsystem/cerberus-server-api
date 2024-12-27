import { Router } from 'express';
const router = Router();
import { generarCodigo, regHorasExtras, regPapeleta } from '../controllers/csPapeletas.js';

router.post('/pap/gen_codigo_pap', generarCodigo);
router.post('/pap/horas_extras', regHorasExtras);
router.post('/pap/registrar', regPapeleta);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes