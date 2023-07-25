
import { prop } from '../const/defaultResponse.js';
import actionBDController from './csActionOnBD.js';

export const onRegister = async (req, res) => {
    let objNewRegister = req.body;
    //console.log(objNewRegister);
}

export const onRegisterPostulante = async (req, res) => {
    let dataPostulante = ((req || {}).body || [])[0] || {};
    let idPostulante = (dataPostulante || {}).id;
    let datosPersonales = (dataPostulante || {}).datos_personales || {};
    let expLaboralList = (dataPostulante || {}).experiencia_laboral || [];
    let forAcademicaList = (dataPostulante || {}).formacion_academica || [];
    let derHabienteList = (dataPostulante || {}).derecho_habiente || [];
    let datosSaludList = (dataPostulante || {}).datos_salud || [];
    
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
    '${datosSaludList.alergias}',
    '${datosSaludList.enfermedad}',
    '${datosSaludList.medicamento}',
    '${datosSaludList.grupo_sanguineo}',
    '${datosSaludList.antecedentes_penales}',
    '${datosSaludList.antecedentes_judiciales}',
    '${datosSaludList.antecedentes_penales}'`;

    let existRegister = await actionBDController.verificationRegister('TB_FICHA_EMPLEADO', `KEY_FICHA = '${idPostulante}'`);
    let tipoExcution = !existRegister.length ? 'I' : 'U';

    await actionBDController.execQuery(`CALL SP_CRUD_FICHA_EMPLEADO('${tipoExcution}',${cadenaFichaEmpleado})`);

    let existLFE = await actionBDController.verificationRegister('TB_EXP_LABORAL_FICHA_EMPLEADO', `KEY_FICHA = '${idPostulante}'`);

    if (existLFE.length) {
        await actionBDController.execQuery(`DELETE FROM TB_EXP_LABORAL_FICHA_EMPLEADO WHERE KEY_FICHA = '${idPostulante}'`);
    }

    let existFA = await actionBDController.verificationRegister('TB_FORM_ACADEMICA', `KEY_FICHA = '${idPostulante}'`);

    if (existFA.length) {
        await actionBDController.execQuery(`DELETE FROM TB_FORM_ACADEMICA WHERE KEY_FICHA = '${idPostulante}'`);
    }

    let existDH = await actionBDController.verificationRegister('TB_DATOS_HABIENTES', `KEY_FICHA = '${idPostulante}'`);

    if (existDH.length) {
        await actionBDController.execQuery(`DELETE FROM TB_DATOS_HABIENTES WHERE KEY_FICHA = '${idPostulante}'`);
    }

    (expLaboralList || []).filter(async (el) => {
        await actionBDController.execQuery(`CALL SP_CRUD_EXP_LABORAL_FICHA_EMPLEADO('I','${idPostulante}','${el.empresa}','${el.puesto}','${el.desde}','${el.culmino}','${el.culmino}')`);
    });

    (forAcademicaList || []).filter(async (fa) => {
        await actionBDController.execQuery(`CALL SP_CRUD_FORM_ACADEMICA('I','${idPostulante}','${fa.tipo}','${fa.ctrEstudio}','${fa.carrera}','${fa.estado}')`);
    });

    (derHabienteList || []).filter(async (dh) => {
        await actionBDController.execQuery(`CALL SP_CRUD_DATOS_HABIENTES('I','${idPostulante}','${dh.nombres}','${dh.parentesco}','${dh.edad}','${dh.sexo}','${dh.tipodoc}','${dh.nrodoc}','${dh.fchnac}','${dh.ocupacion}')`);
    });

    console.log(datosSaludList);
    if (datosSaludList.length) {
        let existDSA = await actionBDController.verificationRegister('TB_DATOS_SALUD_ANTECEDENTES', `KEY_FICHA = '${idPostulante}'`);
        console.log(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES(${(existDSA.length) ? 'U' : 'I'},${saludAntecedentes})`);
        await actionBDController.execQuery(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES(${(existDSA.length) ? 'U' : 'I'},${saludAntecedentes})`);
    }

    res.json(prop.success.default);
}