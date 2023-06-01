import { Router } from 'express';
const router = Router();
import controlAsistenciaController from '../controllers/csControlAsistencia.js';
import { onRegister } from '../controllers/csVendedores.js';

router.get('/search/asistencia', controlAsistenciaController.onSearchData);
router.get('/search/asistencia/pagination', controlAsistenciaController.onPaginationData);
router.get('/registrar/vendedor', onRegister);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes