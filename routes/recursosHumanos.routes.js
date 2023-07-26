import { Router } from 'express';
const router = Router();
import controlAsistenciaController from '../controllers/csControlAsistencia.js';
import { onPostulanteList, onRegisterPostulante } from '../controllers/csVendedores.js';

router.get('/search/asistencia', controlAsistenciaController.onSearchData);
router.get('/search/asistencia/pagination', controlAsistenciaController.onPaginationData);
router.get('/search/postulante', onPostulanteList);
router.post('/registrar/inscripcion_postulante', onRegisterPostulante);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes