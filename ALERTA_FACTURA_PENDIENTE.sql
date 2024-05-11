USE [COE_DATA]
GO
/****** Object:  Trigger [dbo].[TRIGGER_SUNAT_NOTIFICATION_FACTURAS]    Script Date: 09/05/2024 15:46:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER   TRIGGER [dbo].[TRIGGER_SUNAT_NOTIFICATION_FACTURAS]
ON [dbo].[coe_factura]
AFTER UPDATE
AS
BEGIN
IF UPDATE(estado)
BEGIN
DECLARE 
@BODY VARCHAR(4000),
@LAST_STATUS INT
SET NOCOUNT ON;
	
	IF ((@ID_ESTADO_SUNAT = 4 OR @ID_ESTADO_SUNAT = 0) AND (@CODIGO_ERROR_SUNAT = 2800 OR @CODIGO_ERROR_SUNAT = 1032 OR @CODIGO_ERROR_SUNAT = 1033 OR @CODIGO_ERROR_SUNAT = 2022 OR @CODIGO_ERROR_SUNAT = 1083)) 
		BEGIN
			SET @BODY = (SELECT idfactura AS CODIGO_DOCUMENTO,
					t08_numcorrelativo AS NRO_CORRELATIVO,
					t10_nomadquiriente AS NOM_ADQUIRIENTE, 
					t09_numdoc AS NRO_DOCUMENTO,
					@TIPO_DOCUMENTO_ADQUIRIENTE AS TIPO_DOCUMENTO_ADQUIRIENTE,
					observacion AS OBSERVACION,
					@ESTADO_SUNAT AS ESTADO_SUNAT,
					@ESTADO_DOCUMENTO AS ESTADO_COMPROBANTE,
					@CODIGO_ERROR_SUNAT AS CODIGO_ERROR_SUNAT,
					t01_fecemision AS FECHA_EMISION
					FROM INSERTED FOR JSON AUTO);
	
			-- declaramos una variable cadena y ponemos la url a invocar
			Declare @url varchar(max)='http://190.117.53.171:3200/facturas-pendiente'
			-- declaramos una variable entero, para guardar el id del objeto OLE que crearemos
			Declare @Object as Int;
			-- Una variable cadena para la respuesta
			Declare @ResponseText as Varchar(8000);
			 
			-- creamos un objeto OLE
			Exec sp_OACreate 'MSXML2.XMLHTTP', @Object OUT;
			-- Ejecutamos la url por medio de post
			Exec sp_OAMethod @Object, 'open', NULL, 'post',@url,'false'
			EXEC sp_OAMethod @Object, 'setRequestHeader', null, 'Content-Type', 'application/json'
			Exec sp_OAMethod @Object, 'send', NULL, @Body;
			Exec sp_OAMethod @Object, 'responseText', @ResponseText OUTPUT
			 
			-- imprimimos resultado
			Select @ResponseText
			 
			--eliminamos nuestro id de objeto OLE
			Exec sp_OADestroy @Object
		END
END


END
END