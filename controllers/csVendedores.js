

export const onRegister = async (req, res) => {
    let objNewRegister = req.body;
    console.log(objNewRegister);
}

export const onRegisterPostulante = async (req, res) => {
    let dataPostulante = ((req || {}).body || [])[0] || {};
    let datosPersonales = (dataPostulante || {}).datos_personales || {};
    let nroDocumento = (datosPersonales || {}).num_documento || "";
    let existRegister = await actionBDController.verificationRegister('TB_FICHA_EMPLEADO', `NUM_DOCUMENTO = '${nroDocumento}'`);

    if (!existRegister) {
        let cadenaColumn = `AP_PATERNO,AP_MATERNO,FC_NOMBRES,FECH_NAC,PAIS_NACIMIENTO,TIPO_DOCUMENTO,NUM_DOCUMENTO,SEXO,ESTADO_CIVIL,FC_DOCIMILIO,REFERENCIA,CORREO_ELECTONICO,FC_CELULAR,REGIMEN_PENSIONARIO,NOMBRE_CONTACT_EMERGENCIA,NUM_CONTACT_EMERGENCIA,DISTRITO`;
        let cadenaData = `'${(datosPersonales || {}).nombre_apellido}',
        '${(datosPersonales || {}).fec_nacimiento}',
        '${(datosPersonales || {}).pais_nacimiento}',
        '${(datosPersonales || {}).tipo_documento}',
        '${(datosPersonales || {}).num_documento}',
        '${(datosPersonales || {}).sexo}',
        '${(datosPersonales || {}).estado_civil}',
        '${(datosPersonales || {}).distrito}',
        '${(datosPersonales || {}).direccion}',
        '${(datosPersonales || {}).referencia}',
        '${(datosPersonales || {}).email}',
        '${(datosPersonales || {}).email}',//*/
        '${(datosPersonales || {}).tipo_pension}',
        '${(datosPersonales || {}).contacto_emergengia}',
        '${(datosPersonales || {}).numero_emergencia}'`;

        await actionBDController.insertRegister("TB_FICHA_EMPLEADO", cadenaColumn, cadenaData);
    } else {


    }


}