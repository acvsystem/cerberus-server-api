
import { prop } from '../const/defaultResponse.js';
import actionBDController from './csActionOnBD.js';
import { pool } from '../conections/conexMysql.js';


export const onEmpleadoList = async (req, res) => {
    let [datosPersonales] = await pool.query(`SELECT * FROM TB_EMPLEADO;`);

    let response = [
        {
            data: datosPersonales,
            status: prop.success.default
        }
    ];

    res.json(response);
};

export const onPostulanteList = async (req, res) => {
    let [datosPersonales] = await pool.query(`SELECT * FROM TB_FICHA_EMPLEADO;`);
    let [expLaboralList] = await pool.query(`SELECT * FROM TB_EXP_LABORAL_FICHA_EMPLEADO;`);
    let [forAcademicaList] = await pool.query(`SELECT * FROM TB_FORM_ACADEMICA;`);
    let [derHabienteList] = await pool.query(`SELECT * FROM TB_DATOS_HABIENTES;`);
    let [datosSaludList] = await pool.query(`SELECT * FROM TB_DATOS_SALUD_ANTECEDENTES;`);
    let [estadoPostulanteList] = await pool.query(`SELECT * FROM TB_ESTADO_POSTULANTE;`);

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
                        "direccion": (dp || {}).FC_DOCIMILIO,
                        "referencia": (dp || {}).REFERENCIA,
                        "email": (dp || {}).CORREO_ELECTONICO,
                        "tipo_pension": (dp || {}).REGIMEN_PENSIONARIO,
                        "contacto_emergengia": (dp || {}).NOMBRE_CONTACT_EMERGENCIA,
                        "numero_emergencia": (dp || {}).NUM_CONTACT_EMERGENCIA,
                        "estado": "",
                        "tienda": ""
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

            (estadoPostulanteList || []).filter((std) => {
                if (std.DNI == (dp || {}).KEY_FICHA) {
                    let index = dataResponse.findIndex((dt) => dt.id == (std || {}).DNI);
                    dataResponse[index].datos_personales.estado = (std || {}).ESTADO;
                    dataResponse[index].datos_personales.tienda = (std || {}).TIENDA;
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
    console.log(dataPostulante);
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
    '${(datosPersonales || {}).referencia}',
    '${(datosPersonales || {}).email}',
    '${(datosPersonales || {}).nro_celular}',
    '${(datosPersonales || {}).tipo_pension}',
    '${(datosPersonales || {}).contacto_emergengia}',
    '${(datosPersonales || {}).numero_emergencia}',
    '${(datosPersonales || {}).tipo_via}',
    '${(datosPersonales || {}).nombre_via}',
    '${(datosPersonales || {}).nro_domicilio}',
    '${(datosPersonales || {}).nro_departamento}',
    '${(datosPersonales || {}).ds_manzana}',
    '${(datosPersonales || {}).ds_lote}',
    '${(datosPersonales || {}).tipo_zona}',
    '${(datosPersonales || {}).nombre_zona}',
    '${(datosPersonales || {}).tipo_vivienda}'`;

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

    let existEstado = await actionBDController.verificationRegister('TB_ESTADO_POSTULANTE', `DNI = '${idPostulante}'`);

    if (!existEstado.length) {
        actionBDController.execQuery(`INSERT INTO TB_ESTADO_POSTULANTE(DNI,ESTADO,TIENDA)VALUES('${idPostulante}','PENDIENTE','')`);
    }

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

    if ((expLaboralList || []).length) {
        (expLaboralList || []).filter(async (el) => {
            await actionBDController.execQuery(`CALL SP_CRUD_EXP_LABORAL_FICHA_EMPLEADO('I','${idPostulante}','${el.empresa}','${el.puesto}','${el.desde}','${el.culmino}','${el.culmino}')`);
        });
    }

    if ((forAcademicaList || []).length) {
        (forAcademicaList || []).filter(async (fa) => {
            await actionBDController.execQuery(`CALL SP_CRUD_FORM_ACADEMICA('I','${idPostulante}','${fa.tipo}','${fa.ctrEstudio}','${fa.carrera}','${fa.estado}')`);
        });
    }

    if ((derHabienteList || []).length) {
        (derHabienteList || []).filter(async (dh) => {
            await actionBDController.execQuery(`CALL SP_CRUD_DATOS_HABIENTES('I','${idPostulante}','${dh.nombres}','${dh.parentesco}','${dh.edad}','${dh.sexo}','${dh.tipodoc}','${dh.nrodoc}','${dh.fchnac}','${dh.ocupacion}')`);
        });
    }

    if (Object.keys(datosSaludList).length) {
        let existDSA = await actionBDController.verificationRegister('TB_DATOS_SALUD_ANTECEDENTES', `KEY_FICHA = '${idPostulante}'`);
        console.log(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES('${(existDSA.length) ? 'U' : 'I'}',${saludAntecedentes})`);
        await actionBDController.execQuery(`CALL SP_CRUD_DATOS_SALUD_ANTECEDENTES('${(existDSA.length) ? 'U' : 'I'}',${saludAntecedentes})`);
    }

   /* let existEMP = await actionBDController.verificationRegister('TB_EMPLEADO', `NRO_DOC = '${idPostulante}';`);

    if (!existEMP.length) {

        await actionBDController.execQuery(`INSERT INTO TB_EMPLEADO(
        CODIGO_ICG,
        CODIGO_EJB,
        AP_PATERNO,
        AP_MATERNO,
        NOM_EMPLEADO,
        ESTADO_EMP,
        ESTADO_CIVIL,
        TIPO_DOC,
        NRO_DOC,
        TLF_EMP,
        EMAIL_EMP,
        FEC_NAC,
        PAIS_NAC,
        TIENDA_ASIGNADO,
        SALARIO_BASE,
        FEC_INGRESO)VALUES(
            "",
            "",
            '${(datosPersonales || {}).ap_paterno}',
            '${(datosPersonales || {}).ap_materno}',
            '${(datosPersonales || {}).nombres}',
            '${"PENDIENTE"}',
            '${(datosPersonales || {}).estado_civil}',
            '${(datosPersonales || {}).tipo_documento}',
            '${(datosPersonales || {}).num_documento}',
            '${(datosPersonales || {}).nro_celular}',
            '${(datosPersonales || {}).email}',
            '${(datosPersonales || {}).fec_nacimiento}',
            '${(datosPersonales || {}).pais_nacimiento}',
            "",
            0.0,
            ""
        );`);
    } else {
        await actionBDController.execQuery(`UPDATE TB_EMPLEADO SET 
        AP_PATERNO = '${(datosPersonales || {}).ap_paterno}',
        AP_MATERNO = '${(datosPersonales || {}).ap_materno}',
        NOM_EMPLEADO = '${(datosPersonales || {}).nombres}',
        ESTADO_CIVIL = '${(datosPersonales || {}).estado_civil}',
        TIPO_DOC = '${(datosPersonales || {}).tipo_documento}',
        NRO_DOC = '${(datosPersonales || {}).num_documento}',
        TLF_EMP = '${(datosPersonales || {}).nro_celular}',
        EMAIL_EMP = '${(datosPersonales || {}).email}',
        FEC_NAC = '${(datosPersonales || {}).fec_nacimiento}',
        PAIS_NAC = '${(datosPersonales || {}).pais_nacimiento}'
        WHERE NRO_DOC = '${idPostulante}';`);
    }
*/
    let existSTD = await actionBDController.verificationRegister('TB_ESTADO_POSTULANTE', `DNI = '${idPostulante}';`);

    if (!existSTD.length) {
        await actionBDController.execQuery(`INSERT INTO TB_ESTADO_POSTULANTE(DNI,ESTADO,TIENDA)VALUES('${idPostulante}','PENDIENTE','SIN ASIGNAR');`);
    }

    res.json(prop.success.default);
}

export const onDeleteEmployee = async (req, res) => {
    let nroDocumento = ((req || {}).body || {}).nroDocumento;
    if (nroDocumento >= 8) {
        await actionBDController.execQuery(`DELETE FROM TB_EMPLEADO WHERE NRO_DOC = '${nroDocumento}';`);
        await actionBDController.execQuery(`UPDATE TB_ESTADO_POSTULANTE SET ESTADO = 'PENDIENTE' WHERE DNI = '${nroDocumento}';`);
    }

    let response = [
        {
            status: prop.success.default
        }
    ];

    res.json(response);
}

export const onRegisterEmployee = async (req, res) => {
    let dataEmployee = (req || {}).body[0];
    
    let existSTD = await actionBDController.verificationRegister('TB_EMPLEADO', `NRO_DOC = '${dataEmployee.NUM_DOCUMENTO}';`);
    console.log(existSTD);
    if (!existSTD.length) {
        console.log(dataEmployee);
        await actionBDController.execQuery(`INSERT INTO TB_EMPLEADO(
            CODIGO_ICG,
            CODIGO_EJB,
            AP_PATERNO,
            AP_MATERNO,
            NOM_EMPLEADO,
            ESTADO_EMP,
            ESTADO_CIVIL,
            TIPO_DOC,
            NRO_DOC,
            TLF_EMP,
            EMAIL_EMP,
            FEC_NAC,
            PAIS_NAC,
            TIENDA_ASIGNADO,
            SALARIO_BASE,
            FEC_INGRESO)VALUES(
                "",
                '${dataEmployee.CODIGO_EJB}',
                '${dataEmployee.AP_PATERNO}',
                '${dataEmployee.AP_MATERNO}',
                '${dataEmployee.FC_NOMBRES}',
                'ACEPTADO',
                '${dataEmployee.ESTADO_CIVIL}',
                '${dataEmployee.TIPO_DOCUMENTO}',
                '${dataEmployee.NUM_DOCUMENTO}',
                '${dataEmployee.FC_CELULAR}',
                '${dataEmployee.CORREO_ELECTONICO}',
                '${dataEmployee.FECH_NAC}',
                '${dataEmployee.PAIS_NACIMIENTO}',
                '${dataEmployee.TIENDA_ASIGNADO}',
                0.0,
                ""
            );`);
    } else {
        await actionBDController.execQuery(`UPDATE TB_EMPLEADO SET
        CODIGO_EJB = '${dataEmployee.CODIGO_EJB}',
        AP_PATERNO = '${dataEmployee.AP_PATERNO}',
        AP_MATERNO = '${dataEmployee.AP_MATERNO}',
        NOM_EMPLEADO = '${dataEmployee.FC_NOMBRES}',
        ESTADO_CIVIL = '${dataEmployee.ESTADO_CIVIL}',
        TIPO_DOC = '${dataEmployee.TIPO_DOCUMENTO}',
        NRO_DOC = '${dataEmployee.NUM_DOCUMENTO}',
        TLF_EMP = '${dataEmployee.FC_CELULAR}',
        EMAIL_EMP = '${dataEmployee.CORREO_ELECTONICO}',
        PAIS_NAC = '${dataEmployee.PAIS_NACIMIENTO}',
        TIENDA_ASIGNADO = '${dataEmployee.TIENDA_ASIGNADO}' WHERE NRO_DOC = '${dataEmployee.NUM_DOCUMENTO}';`);
    }



    let response = [
        {
            status: prop.success.default
        }
    ];

    res.json(response);
}

export const onCambioEstadoPostulante = async (req, res) => {
    let dataEstado = (req || {}).body || {};

    await actionBDController.execQuery(`UPDATE TB_ESTADO_POSTULANTE SET ESTADO='${(dataEstado || {}).estado}',TIENDA='${(dataEstado || {}).tienda}' WHERE DNI = '${(dataEstado || {}).dni}';`);

    let existSTD = await actionBDController.verificationRegister('TB_ESTADO_POSTULANTE', `DNI = '${(dataEstado || {}).dni}';`);

    if (!existSTD.length) {
        await actionBDController.execQuery(`INSERT INTO TB_ESTADO_POSTULANTE(DNI,ESTADO,TIENDA)VALUES('${(dataEstado || {}).dni}','${(dataEstado || {}).estado}','${(dataEstado || {}).tienda}');`);
    } else {
        await actionBDController.execQuery(`UPDATE TB_ESTADO_POSTULANTE SET ESTADO = '${(dataEstado || {}).estado}',TIENDA ='${(dataEstado || {}).tienda}' WHERE DNI = '${(dataEstado || {}).dni}';`);
    }


    let existEMP = await actionBDController.verificationRegister('TB_EMPLEADO', `NRO_DOC = '${(dataEstado || {}).dni}';`);

    if (!existEMP.length) {
        let [datosPersonales] = await pool.query(`SELECT * FROM TB_FICHA_EMPLEADO  WHERE KEY_FICHA = '${(dataEstado || {}).dni}';`);
        let dp = (datosPersonales || [])[0] || {};

        await actionBDController.execQuery(`INSERT INTO TB_EMPLEADO(
        CODIGO_ICG,
        CODIGO_EJB,
        AP_PATERNO,
        AP_MATERNO,
        NOM_EMPLEADO,
        ESTADO_EMP,
        ESTADO_CIVIL,
        TIPO_DOC,
        NRO_DOC,
        TLF_EMP,
        EMAIL_EMP,
        FEC_NAC,
        PAIS_NAC,
        TIENDA_ASIGNADO,
        SALARIO_BASE,
        FEC_INGRESO)VALUES(
            "",
            "",
            '${dp.AP_PATERNO}',
            '${dp.AP_MATERNO}',
            '${dp.FC_NOMBRES}',
            '${(dataEstado || {}).estado || "PENDIENTE"}',
            '${dp.ESTADO_CIVIL}',
            '${dp.TIPO_DOCUMENTO}',
            '${dp.NUM_DOCUMENTO}',
            '${dp.FC_CELULAR}',
            '${dp.CORREO_ELECTONICO}',
            '${dp.FECH_NAC}',
            '${dp.PAIS_NACIMIENTO}',
            '${(dataEstado || {}).tienda || ""}',
            0.0,
            ""
        );`);
    } else {
        if ((dataEstado || {}).estado == "PENDIENTE" || (dataEstado || {}).estado == "") {
            await actionBDController.execQuery(`DELETE FROM TB_EMPLEADO WHERE NRO_DOC = '${(dataEstado || {}).dni}';`);
        } else {
            await actionBDController.execQuery(`UPDATE TB_EMPLEADO SET TIENDA_ASIGNADO ='${(dataEstado || {}).tienda || ""}',ESTADO_EMP = '${(dataEstado || {}).estado || "PENDIENTE"}'  WHERE NRO_DOC = '${(dataEstado || {}).dni}';`);
        }
    }

    let [estadoPostulanteList] = await pool.query(`SELECT * FROM TB_ESTADO_POSTULANTE WHERE DNI = '${(dataEstado || {}).dni}';`);

    let response = [
        {
            data: (estadoPostulanteList || [])[0] || [],
            status: prop.success.default
        }
    ];

    res.json(response);
}