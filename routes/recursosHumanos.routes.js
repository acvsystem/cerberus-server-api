import { Router } from 'express';
const router = Router();
import { generarCodigo, regHorasExtras, regPapeleta, listPapeleta } from '../controllers/csPapeletas.js';

router.post('/pap/gen_codigo_pap', generarCodigo);
router.post('/pap/horas_extras', regHorasExtras);
router.post('/pap/registrar', regPapeleta);
router.post('/pap/lista/papeleta', listPapeleta);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes