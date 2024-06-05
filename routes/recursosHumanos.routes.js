import { Router } from 'express';
const router = Router();
import controlAsistenciaController from '../controllers/csControlAsistencia.js';
import { onPostulanteList, onRegisterPostulante, onCambioEstadoPostulante, onEmpleadoList, onRegisterEmployee, onDeleteEmployee } from '../controllers/csVendedores.js';

router.get('/search/asistencia', controlAsistenciaController.onSearchData);
router.get('/search/asistencia/pagination', controlAsistenciaController.onPaginationData);
router.get('/search/postulante', onPostulanteList);
router.post('/registrar/inscripcion_postulante', onRegisterPostulante);
router.post('/update/estado_postulante', onCambioEstadoPostulante);
router.get('/search/empleado', onEmpleadoList);
router.post('/registrar/employee', onRegisterEmployee);
router.post('/delete/employee', onDeleteEmployee);

const recursosHumanosRoutes = router;
export default recursosHumanosRoutes