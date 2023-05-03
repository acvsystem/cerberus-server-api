import { Router } from 'express';
const router = Router();
import controlAsistenciaController from '../controllers/csControlAsistencia.js';

router.get('/search/asistencia', controlAsistenciaController.onSearchData);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes