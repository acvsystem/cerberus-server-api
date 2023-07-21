
import { prop } from '../const/defaultResponse.js';
import actionBDController from './csActionOnBD.js';

export const onRegister = async (req, res) => {
    let objNewRegister = req.body;
    //console.log(objNewRegister);
}

export const onRegisterPostulante = async (req, res) => {
    let dataPostulante = ((req || {}).body || [])[0] || {};
    let idPostulante = (dataPostulante || {}).id;
    console.log(dataPostulante);
    let datosPersonales = (dataPostulante || {}).datos_personales || {};
    let expLaboralList = (dataPostulante || {}).experiencia_laboral || [];
    let forAcademicaList = (dataPostulante || {}).formacion_academica || [];
    let derHabienteList = (dataPostulante || {}).derecho_habiente || [];

    let cadenaFichaEmpleado = `'${idPostulante}','${(datosPersonales || {}).ap_paterno}',
    '${(datosPersonales || {}).ap_materno}',
    '${(datosPersonales || {}).nombres}',
    '${(datosPersonales || {}).fec_nacimiento}',
    '${(datosPersonales || {}).pais_nacimiento}',
    '${(datosPersonales || {}).tipo_documento}',
    '${(datosPersonales || {}).num_documento}',
    '${(datosPersonales || {}).sexo}',
    '${(datosPersonales || {}).estado_civil}',
    '${(datosPersonales || {}).direccion}',
    '${(datosPersonales || {}).referencia}',
    '${(datosPersonales || {}).email}',
    '${(datosPersonales || {}).nro_celular}',
    '${(datosPersonales || {}).tipo_pension}',
    '${(datosPersonales || {}).contacto_emergengia}',
    '${(datosPersonales || {}).numero_emergencia}'`;

    let saludAntecedentes = `'${idPostulante}',
    ${derHabienteList.alergias},
    ${derHabienteList.enfermedad},
    ${derHabienteList.medicamento},
    ${derHabienteList.grupo_sanguineo},
    ${derHabienteList.antecedentes_penales},
    ${derHabienteList.antecedentes_judiciales},
    ${derHabienteList.antecedentes_penales}`;

    let existRegister = await actionBDController.verificationRegister('TB_FICHA_EMPLEADO', `KEY_FICHA = '${idPostulante}'`);
    let tipoExcution = !existRegister.length ? 'I' : 'U';
    console.log(existRegister);
    console.log(tipoExcution);
    console.log(cadenaFichaEmpleado);
    console.log(`EXEC SP_CRUD_FICHA_EMPLEADO('${tipoExcution}',${cadenaFichaEmpleado})`);
    await actionBDController.execQuery(`EXEC SP_CRUD_FICHA_EMPLEADO('${tipoExcution}',${cadenaFichaEmpleado})`);
/*
    expLaboralList.filter((el) => {
        actionBDController.execQuery(`EXEC SP_CRUD_EXP_LABORAL_FICHA_EMPLEADO(${tipoExcution},'${idPostulante}','${el.empresa}','${el.puesto}','${el.desde}','${el.culmino}','${el.culmino}')`);
    });

    forAcademicaList.filter((fa) => {
        actionBDController.execQuery(`EXEC SP_CRUD_FORM_ACADEMICA(${tipoExcution},'${idPostulante}',V_TIPO_ESTUDIO VARCHAR(10),'${fa.ctrEstudio}','${fa.carrera}','${fa.estado}')`);
    });

    derHabienteList.filter((dh) => {
        actionBDController.execQuery(`EXEC SP_CRUD_DATOS_HABIENTES(${tipoExcution},'${idPostulante}',${dh.nombres},${dh.parentesco},${dh.edad},${dh.sexo},${dh.tipodoc},${dh.nrodoc},V_FECH_NAC VARCHAR(20),V_OCUPACION VARCHAR(300))`);
    });

    await actionBDController.execQuery(`EXEC SP_CRUD_DATOS_SALUD_ANTECEDENTES(${tipoExcution},${saludAntecedentes})`);
*/

    res.json(prop.success.default);
}