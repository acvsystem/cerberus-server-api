import { Router } from 'express';
const router = Router();
import controlAsistenciaController from '../controllers/csControlAsistencia.js';

router.get('/search/asistencia', controlAsistenciaController.onSearchData);
router.get('/search/asistencia/pagination', controlAsistenciaController.onPaginationData);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes