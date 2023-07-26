
import { prop } from '../const/defaultResponse.js';
import actionBDController from './csActionOnBD.js';
import { pool } from '../conections/conexMysql.js';

export const onPostulanteList = async (req, res) => {
    let [datosPersonales] = await pool.query(`SELECT * FROM TB_FICHA_EMPLEADO;`);
    let [expLaboralList] = await pool.query(`SELECT * FROM TB_EXP_LABORAL_FICHA_EMPLEADO;`);
    let [forAcademicaList] = await pool.query(`SELECT * FROM TB_FORM_ACADEMICA;`);
    let [derHabienteList] = await pool.query(`SELECT * FROM TB_DATOS_HABIENTES;`);
    let [datosSaludList] = await pool.query(`SELECT * FROM TB_DATOS_SALUD_ANTECEDENTES;`);

    let dataResponse = [];

    await (datosPersonales || []).filter((dp) => {
        return new Promise((resolve, reject) => {
            dataResponse.push(
                {
                    "id": (dp || {}).KEY_FICHA,
                    "datos_personales": {
                        "nombres": (dp || {}).FC_NOMBRES,
                        "ap_paterno": (dp || {}).AP_PATERNO,
                        "ap_materno": (dp || {}).AP_MATERNO,
                        "nro_celular": (dp || {}).FC_CELULAR,
                        "fec_nacimiento": (dp || {}).FECH_NAC,
                        "pais_nacimiento": (dp || {}).PAIS_NACIMIENTO,
                        "tipo_documento": (dp || {}).TIPO_DOCUMENTO,
                        "num_documento": (dp || {}).NUM_DOCUMENTO,
                        "sexo": (dp || {}).SEXO,
                        "estado_civil": (dp || {}).ESTADO_CIVIL,
                        "direccion": (dp || {}).FC_DOMICILIO,
                        "referencia": (dp || {}).REFERENCIA,
                        "email": (dp || {}).CORREO_ELECTRONICO,
                        "tipo_pension": (dp || {}).REGIMEN_PENSIONARIO,
                        "contacto_emergengia": (dp || {}).NOMBRE_CONTACT_EMERGENCIA,
                        "numero_emergencia": (dp || {}).NUM_CONTACT_EMERGENCIA
                    },
                    "experiencia_laboral": [],
                    "formacion_academica": [],
                    "derecho_habiente": [],
                    "datos_salud": {
                        "alergias": datosSaludList[0].ALERGIAS,
                        "enfermedad": datosSaludList[0].ENFERMEDAD,
                        "medicamento": datosSaludList[0].MEDICAMENTOS,
                        "grupo_sanguineo": datosSaludList[0].GRUPO_SANGUINEO,
                        "antecedentes_policiales": datosSaludList[0].ANT_POLICIALES,
                        "antecedentes_judiciales": datosSaludList[0].ANT_JUDICIALES,
                        "antecedentes_penales": datosSaludList[0].ANT_PENALES
                    }
                }
            );

            (forAcademicaList || []).filter((fa) => {
                if (fa.KEY_FICHA == (dp || {}).KEY_FICHA) {
                    let index = dataResponse.findIndex((dt) => dt.id == (fa || {}).KEY_FICHA);
                    dataResponse[index].formacion_academica.push(
                        {
                            "ctrEstudio": (fa || {}).CENTRO_ESTUDIO,
                            "carrera": (fa || {}).CARRERA,
                            "estado": (fa || {}).ESTADO,
                            "tipo": (fa || {}).TIPO_ESTUDIO
                        }
                    );
                }
            });

            (expLaboralList || []).filter((ell) => {
                if (ell.KEY_FICHA == (dp || {}).KEY_FICHA) {
                    let index = dataResponse.findIndex((dt) => dt.id == (ell || {}).KEY_FICHA);
                    dataResponse[index].experiencia_laboral.push(
                        {
                            "empresa": (ell || {}).NOMBRE_EMPRESA,
                            "puesto": (ell || {}).PUESTO,
                            "desde": (ell || {}).FECH_INICIO,
                            "culmino": (ell || {}).FECH_FIN,
                            "motivo": (ell || {}).MOTIVO_CESE
                        }
                    );
                }
            });

            (derHabienteList || []).filter((da) => {
                if (da.KEY_FICHA == (dp || {}).KEY_FICHA) {
                    let index = dataResponse.findIndex((dt) => dt.id == (da || {}).KEY_FICHA);
                    dataResponse[index].derecho_habiente.push(
                        {
                            "nombres": (da || {}).AP_NOM,
                            "parentesco": (da || {}).PARENTESCO,
                            "edad": (da || {}).EDAD,
                            "sexo": (da || {}).SEXO,
                            "tipodoc": (da || {}).TIPO_DOCUMENTO,
                            "nrodoc": (da || {}).NUM_DOCUMENTO,
                            "fchnac": (da || {}).FECH_NAC,
                            "ocupacion": (da || {}).OCUPACION
                        }
                    );
                }
            });
        });
    });

    console.log(dataResponse);

    let response = [
        {
            data: dataResponse,
            status: prop.success.default
        }
    ];

    res.json(response);
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


    if (Object.keys(datosSaludList).length) {
        let existDSA = await actionBDController.verificationRegister('TB_DATOS_SALUD_ANTECEDENTES', `KEY_FICHA = '${idPostulante}'`);
        console.log(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES('${(existDSA.length) ? 'U' : 'I'}',${saludAntecedentes})`);
        await actionBDController.execQuery(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES('${(existDSA.length) ? 'U' : 'I'}',${saludAntecedentes})`);
    }

    res.json(prop.success.default);
}