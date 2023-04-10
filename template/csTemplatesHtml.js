class clsTemplate {

    registerAccount(data) {
        let link = (data || {}).link || '';

        let body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <table style="width: 100%;border-spacing: 0;">
                <tbody>
                    <tr style="display: flex;align-items: center;justify-content: center;">
                        <td>
                            <table style="border-radius: 4px; border-spacing: 0;border: 1px solid #155795;min-width: 450px;">
                                <tbody>
                                    <tr>
                                        <td style="border-top-left-radius: 4px;border-top-right-radius: 4px;display: flex;align-items: center;justify-content: center;background: #155795;padding: 20px;">
                                            <p style="margin-left:72px;color: #FFF;font-weight: 700;font-size: 30px;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">METAS PERU S.A.C</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                            <p>Hola, puedes accerder a registrate dandole click al boton.</p> 
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="margin-bottom: 10px;display: flex;">
                                            <a style="margin-left:155px;text-decoration: none;background: #155795;padding: 10px 30px;font-size: 18px;color:#FFFF;border-radius: 4px;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" href="${link}">registrarse</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>`;

        return body;
    }

    errorSunat(data) {
        let dataDocument = data || {};

        let body = `<p>Buenos días, adjunto los datos de una factura emitida con numero de RUC errado (Cliente Con DNI, lo cual está prohibido para el caso de factura, para esos casos existen las boletas).</p> 

        <p>Lamentablemente no han cumplido con los procesos y métodos de validación que se les han proporcionado.</p>  
        
        <p>Quedo atento de la persona responsable de emitir dicha factura.</p>  
        
        <p>Realizar la NC con anticipo y/o vale.  Si tienen alguna inquietud me dejan saber.</p>
        
        <p>Saludos.

        <p><strong>Datos de factura emitida:</strong></p>
        
        <table align="left" cellspacing="0">
    	    <thead>
    	    	<tr>
    	    		<th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">ID.FACTURA</th>
    	    		<th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">NUM.FACTURA</th>
    	    		<th style="border: 1px solid #9E9E9E;border-right:0px" width="110px">FEC.EMISION</th>
    	    		<th style="border: 1px solid #9E9E9E;border-right:0px" width="200px">NOM.CLIENTE</th>
    	    		<th style="border: 1px solid #9E9E9E" width="140px">NUM.DOCUMENTO</th>
    	    	</tr>
    	    </thead>
    	    <tbody>
    	    	<tr>
    	    		<td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(dataDocument || {}).CODIGO_DOCUMENTO}</td>
    	    		<td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(dataDocument || {}).NRO_CORRELATIVO}</td>
    	    		<td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(dataDocument || {}).FECHA_EMISION}</td>
    	    		<td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center;border-right:0px">${(dataDocument || {}).NOM_ADQUIRIENTE}</td>
    	    		<td style="border: 1px solid #9E9E9E;border-top:0px;text-align:center">${(dataDocument || {}).NRO_DOCUMENTO}</td>
    	    	</tr>
    	    </tbody>
        </table>`;

        return body;
    }



}

const templateHtmlController = new clsTemplate;
export default templateHtmlController;

