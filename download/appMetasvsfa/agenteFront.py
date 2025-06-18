import pyodbc
import requests
import collections
import json
import socketio
sio = socketio.Client()
import socket
import time
from datetime import datetime,timedelta
from getmac import get_mac_address as gma
import requests
import pandas as pd
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import msvcrt

res = requests.post('http://161.132.94.174:3200/frontRetail/search/configuration/agente',data={"mac":gma()})
configuration = res.json()
print('configuration',configuration)


if len(configuration) > 0:
    parametros = configuration[0]
    serieTienda = parametros['SERIE_TIENDA']
    instanciaBD = parametros['DATABASE_INSTANCE']
    nameBD = parametros['DATABASE_NAME']
    codFactura = parametros['COD_TIPO_FAC']
    codBoleta = parametros['COD_TIPO_BOL']
    propertyStock = parametros['PROPERTY_STOCK']
    nameExcel = parametros['NAME_EXCEL_REPORT_STOCK']
    asuntoEmail = parametros['ASUNTO_EMAIL_REPORT_STOCK']
    
    hash = 'U2FsdGVkX19N0xc+gKZEcnXvJc/aJ0AySfiJ7XubWHxfkZ5fWetzn7n1OD+Lebp3jr1yk3qKnMUBdKy5nDZHHw=='
    
    sio.connect('http://161.132.94.174:3200', transports=['websocket'], headers={'code': serieTienda})

    @sio.event
    def disconnect():
        print('disconnected from server')

    @sio.event
    def comprobantesGetFR(configuration):
        consultarComprobantes(configuration)

    @sio.event
    def transaccionesGetFR(configuracion):
        consultarTransacciones(configuracion)

    @sio.event
    def terminalesGetNameFR(configuracion):
        consultarNombreTerminal(configuracion)

    @sio.event
    def transaccionesPostFR(data):
        transferenciaColaCaja(data)

    @sio.event
    def kardexGetcomprobantesFR(data):
        print(data)
        if data['code'] == serieTienda:
            fnKardex(data)

    @sio.event
    def kardexPostcamposlibresFR(data):
        print(data)
        if data['code'] == serieTienda:
            fnKardexCamposLibres(data)
        
    @sio.event
    def kardexGetcuoFR(data):
        print(data)
        if data['code'] == serieTienda:
            fnKardexCuo(data)

    @sio.event
    def kardexPostcuoFR(data):
        print(data)
        if data['data'][0]['code'] == serieTienda:
            fnKardexCuoInsert(data)

    @sio.event
    def terminalesGetcantidadFR(configuracion):
        consultingCajasFront(configuracion)

    @sio.event
    def searchCantCliente(data,socketID):
        consultingClient(data,socketID)

    @sio.event
    def limpiarCliente(data,socketID):
        consultingNotFound(data)
        deleteDescatalogado('data')
        consultingClient(data,socketID)

    @sio.event
    def searchStockTest(email,codeList):
        rows = codeList
        for row in rows:
            if row['code'] == serieTienda:
                reporteStock(email)

    @sio.event
    def searchStockTable(codeList,barcode,socketID):
        rows = codeList
        for row in rows:
            if row['code'] == serieTienda:
                fnSendDataFront(barcode,socketID)  

    

    def fnSendDataFront(barcode,socketID):
        myobj = []
        responseData = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        if len(barcode) :
            if serieTienda == '7A' or serieTienda == '7J' or serieTienda == '7E' or serieTienda == '7C' or serieTienda == '7D' or serieTienda == '7F' or serieTienda == '7A7' or serieTienda == '7I':
                querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLO_REFERENCIA AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  AL.CODBARRAS = '"+str(barcode)+"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLO_REFERENCIA;"
            if serieTienda == '9N' or serieTienda == '9D' or serieTienda == '9B' or serieTienda == '9C' or serieTienda == '9I' or serieTienda == '9G' or serieTienda == '9H' or serieTienda == '9M' or serieTienda == '9K' or serieTienda == '9P':
                querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLO AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  AL.CODBARRAS = '"+str(barcode)+"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLO;"
            if serieTienda == '9L' or serieTienda == '9F':
                querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLE AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  AL.CODBARRAS = '"+str(barcode)+"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLE;"
        else:  
            querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA;"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        if len(barcode):
            if len(rows) > 0:
                for row in rows:
                    if len(barcode):
                        if serieTienda == '7A' or serieTienda == '7J' or serieTienda == '7E' or serieTienda == '7C' or serieTienda == '7D' or serieTienda == '7F' or serieTienda == '7A7' or serieTienda == '7I':
                            querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLO_REFERENCIA AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  CL.STYLO_REFERENCIA = '"+ str(row[12]) +"' AND S.COLOR= '"+ str(row[9]) +"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLO_REFERENCIA;"
                        if serieTienda == '9N' or serieTienda == '9D' or serieTienda == '9B' or serieTienda == '9C' or serieTienda == '9I' or serieTienda == '9G' or serieTienda == '9H' or serieTienda == '9M' or serieTienda == '9K' or serieTienda == '9P':
                            querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLO AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  CL.STYLO = '"+ str(row[12]) +"' AND S.COLOR= '"+ str(row[9]) +"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLO;"
                        if serieTienda == '9L' or serieTienda == '9F':
                            print(str(row[12]),str(row[9]))
                            if str(row[12]) != "None" and str(row[9] != "NA"):
                                querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLE AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  CL.STYLE = '"+ str(row[12]) +"' AND S.COLOR= '"+ str(row[9]) +"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLE;"
                            else:
                                querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA, CL.STYLE AS STYLE FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN ARTICULOSCAMPOSLIBRES CL WITH(NOLOCK) ON ART.CODARTICULO=CL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE  AL.CODBARRAS = '"+str(barcode)+"' AND DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != ''  GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA,CL.STYLE;"
                                
                        connection = pyodbc.connect(conexion)
                        cursor = connection.cursor()
                        cursor.execute("SELECT @@version;")
                        row = cursor.fetchone()
                        cursor.execute(querySql)
                        rows_2 = cursor.fetchall()
                        if len(rows) > 0:
                            for row in rows_2:
                                obj = collections.OrderedDict()
                                obj['cCodigoTienda'] = serieTienda
                                obj['cCodigoArticulo'] = row[0]
                                obj['cReferencia'] = row[1]
                                obj['cCodigoBarra'] = row[2]
                                obj['cDescripcion'] = row[3]
                                obj['cDepartamento'] = row[4]
                                obj['cSeccion'] = row[5]
                                obj['cFamilia'] = row[6]
                                obj['cSubFamilia'] = row[7]
                                obj['cTemporada'] = row[11]
                                obj['cTalla'] = row[8]
                                obj['cColor'] = row[9]
                                obj[propertyStock] = row[10]

                                myobj.append(obj)
                        else:
                            obj = collections.OrderedDict()
                            obj['cCodigoTienda'] = serieTienda
                            obj['cCodigoBarra'] = barcode
                            obj[propertyStock] = 0
                            myobj.append(obj)
                    else:
                        obj = collections.OrderedDict()
                        obj['cCodigoTienda'] = serieTienda
                        obj['cCodigoBarra'] = barcode
                        obj[propertyStock] = 0
                        myobj.append(obj)

            else:
                obj = collections.OrderedDict()
                obj['cCodigoTienda'] = serieTienda
                obj['cCodigoBarra'] = barcode
                obj[propertyStock] = 0
                myobj.append(obj)
        else:
            connection = pyodbc.connect(conexion)
            cursor = connection.cursor()
            cursor.execute("SELECT @@version;")
            row = cursor.fetchone()
            cursor.execute(querySql)
            rows = cursor.fetchall()
            for row in rows:
                obj = collections.OrderedDict()
                obj['cCodigoTienda'] = serieTienda
                obj['cCodigoArticulo'] = row[0]
                obj['cReferencia'] = row[1]
                obj['cCodigoBarra'] = row[2]
                obj['cDescripcion'] = row[3]
                obj['cDepartamento'] = row[4]
                obj['cSeccion'] = row[5]
                obj['cFamilia'] = row[6]
                obj['cSubFamilia'] = row[7]
                obj['cTemporada'] = row[11]
                obj['cTalla'] = row[8]
                obj['cColor'] = row[9]
                obj[propertyStock] = row[10]
                obj['socketID'] = socketID
                myobj.append(obj)
        print(myobj)
        x = requests.post('http://161.132.94.174:3200/frontRetail/search/stock', json = myobj)
        print(x)
        
    
    def consultarComprobantes(configuration):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        print(conexion)
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="SELECT CASE TIPOSDOC.TIPODOC WHEN '"+codFactura+"' THEN SUBSTRING(CONCAT('F',NUMSERIE),1,len(CONCAT('F',NUMSERIE))-1) WHEN '"+codBoleta+"' THEN SUBSTRING(CONCAT('B',NUMSERIE),1,len(CONCAT('B',NUMSERIE))-1) ELSE SUBSTRING(CONCAT(CONCAT(SUBSTRING(NUMSERIE,4,1),NUMSERIE),NUMSERIE),1,len(NUMSERIE)) END AS NUMSERIE, NUMFACTURA,TIPOSDOC.DESCRIPCION, FORMAT(FECHA,'yyyy-MM-dd') AS FECHA FROM FACTURASVENTA INNER JOIN TIPOSDOC ON TIPOSDOC.TIPODOC = FACTURASVENTA.TIPODOC WHERE FECHA BETWEEN '"+lastDate+"' AND '"+nowDate+"';"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obj = collections.OrderedDict()
            obj['cmpSerie'] = row[0]
            obj['cmpNumero'] = row[1]
            obj['cmpTipo'] = row[2]
            obj['cmpFecha'] = row[3]
            myobj.append(obj)
        j = json.dumps(myobj)
        print("-----ENVIO SOLICITUD A SERVIDOR BACKUP BACKEND: comprobantesGetSBK")
        sio.emit('comprobantes:get:fr:response',{'data':j,'configuration':configuration})

    def transferenciaColaCaja(data):
        if data[0]['dataOne']['CODIGO'] == serieTienda and data[0]['dataTwo']['CODIGO'] == serieTienda:
            server = instanciaBD
            dataBase = nameBD
            conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
            print(conexion)
            querySql="UPDATE REM_TRANSACCIONES SET TERMINAL = '"+data[0]['dataTwo']['NOM_TERMINAL']+"' WHERE IDCENTRAL = -1 AND TERMINAL = '"+data[0]['dataOne']['NOM_TERMINAL']+"';"
            print("UPDATE REM_TRANSACCIONES SET TERMINAL = '"+data[0]['dataTwo']['NOM_TERMINAL']+"' WHERE IDCENTRAL = -1 AND TERMINAL = '"+data[0]['dataOne']['NOM_TERMINAL']+"';")
            connection = pyodbc.connect(conexion)
            cursor = connection.cursor()
            cursor.execute("SELECT @@version;")
            row = cursor.fetchone()
            cursor.execute(querySql)
            connection.commit()
            
    def consultarNombreTerminal(configuracion):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="SELECT NOMBRE FROM TERMINALES;"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obj = collections.OrderedDict()
            obj['NOM_TERMINAL'] = row[0]
            obj['CODIGO_TIENDA'] = serieTienda
            myobj.append(obj)
        j = json.dumps(myobj)

        print("-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND FRONT RETAIL: terminales:get:name:fr:response")
        sio.emit('terminales:get:name:fr:response',{'data':j,'configuration':configuracion})

    def consultingCajasFront(configuracion):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        print(conexion)
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="SELECT TERMINAL,COUNT(*) AS CANTIDAD FROM REM_TRANSACCIONES WHERE IDCENTRAL = -1 GROUP BY TERMINAL;"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obj = collections.OrderedDict()
            obj['NOM_TERMINAL'] = row[0]
            obj['CANTIDAD'] = row[1]
            obj['CODIGO_TIENDA'] = serieTienda
            myobj.append(obj)
        if len(rows) < 1:
            obj = collections.OrderedDict()
            obj['CODIGO_TIENDA'] = serieTienda
            myobj.append(obj)
        j = json.dumps(myobj)

        print("-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND FRONT RETAIL: terminales:get:name:fr:response")
        sio.emit('terminales:get:cantidad:fr:response',{'data':j,'configuration':configuracion})
    
    def consultarTransacciones(configuracion):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="SELECT COUNT(ID) AS ID FROM REM_TRANSACCIONES;"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obj = collections.OrderedDict()
            obj['remCount'] = row[0]
            
            myobj.append(obj)
        j = json.dumps(myobj)
        print("-----ENVIO RESPUESTA DE FRONT RETAIL A BACKEND FRONT RETAIL: transacciones:get:fr:response")
        sio.emit('transacciones:get:fr:response',{'data':j,'configuration':configuracion})
    
    def consultingClient(data,socketID):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        count = extraCliente(data)
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        
        querySql="SELECT COUNT(*) FROM CLIENTES WHERE ((NOMBRECLIENTE = '' AND NOMBRECOMERCIAL = '') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'AAAAA') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'aaaaa') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'EEEEE') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'eeeee') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'IIIII') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'iiiii') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'OOOOO') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'ooooo') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'UUUUUU') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'uuuuu') OR  LOWER(NOMBRECLIENTE) LIKE '%bbbbb%' OR LOWER(NOMBRECLIENTE) LIKE '%ccccc%' OR LOWER(NOMBRECLIENTE) LIKE '%ddddd%' OR LOWER(NOMBRECLIENTE) LIKE '%fffff%' OR LOWER(NOMBRECLIENTE) LIKE '%ggggg%' OR LOWER(NOMBRECLIENTE) LIKE '%hhhhh%' OR LOWER(NOMBRECLIENTE) LIKE '%jjjjj%' OR LOWER(NOMBRECLIENTE) LIKE '%kkkkk%' OR LOWER(NOMBRECLIENTE) LIKE '%lllll%' OR LOWER(NOMBRECLIENTE) LIKE '%mmmmm%' OR LOWER(NOMBRECLIENTE) LIKE '%nnnnn%' OR LOWER(NOMBRECLIENTE) LIKE '%ppppp%' OR LOWER(NOMBRECLIENTE) LIKE '%qqqqq%' OR LOWER(NOMBRECLIENTE) LIKE '%rrrrr%' OR LOWER(NOMBRECLIENTE) LIKE '%sssss%' OR LOWER(NOMBRECLIENTE) LIKE '%ttttt%' OR LOWER(NOMBRECLIENTE) LIKE '%vvvvv%' OR LOWER(NOMBRECLIENTE) LIKE '%wwwww%' OR LOWER(NOMBRECLIENTE) LIKE '%xxxxx%' OR LOWER(NOMBRECLIENTE) LIKE '%yyyyy%' OR LOWER(NOMBRECLIENTE) LIKE '%zzzzz%') AND DESCATALOGADO = 'F';"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            count += row[0]
            
        obj = collections.OrderedDict()

        obj['clientCant'] = count
        obj['socket'] =  socketID
        myobj.append(obj)
        j = json.dumps(myobj)
        print(j)
        sio.emit('resClient',j)

    def extraCliente(lsCliente):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        count = 0
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        
        for cli in lsCliente:
            querySql="SELECT count(*) FROM CLIENTES WHERE NOMBRECLIENTE = '"+cli+"' AND DESCATALOGADO = 'F';"
            connection = pyodbc.connect(conexion)
            cursor = connection.cursor()
            cursor.execute("SELECT @@version;")
            row = cursor.fetchone()
            cursor.execute(querySql)
            rows = cursor.fetchall()
            for row in rows:
                count += row[0]

        return count

    def extraDelete(lsCliente):
        myobjA = []
        myobjB = []
        myobjRes = []
        j = {}
        i = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'

        for cli in lsCliente:
            querySql="SELECT CODCLIENTE,NOMBRECLIENTE FROM CLIENTES WHERE NOMBRECLIENTE = '"+cli+"';"
            connection = pyodbc.connect(conexion)
            cursor = connection.cursor()
            cursor.execute("SELECT @@version;")
            row = cursor.fetchone()
            cursor.execute(querySql)
            rows = cursor.fetchall()
            for row in rows:
                obja = collections.OrderedDict()
                querySql_2="SELECT * FROM FACTURASVENTA WHERE CODCLIENTE = "+str(row[0])+";"
                cursor.execute(querySql_2)
                rows_2 = cursor.fetchall()
                for row_2 in rows_2:
                    objb = collections.OrderedDict()
                    objb = row[0]
                    myobjB.append(objb)    
                obja['codigo'] = row[0]
                obja['name'] = row[1]
                myobjA.append(obja)
                for codA in myobjA:
                    if codA['codigo'] in myobjB:
                        print(codA['codigo'],'in',codA['name'])
                        querySql_3="UPDATE CLIENTES SET DESCATALOGADO = 'T' WHERE CODCLIENTE = "+str(codA['codigo'])+";"
                        cursor2 = connection.cursor()
                        cursor2.execute(querySql_3)
                        connection.commit()
                    else:
                        print(codA['codigo'],'not',codA['name'])
                        querySql_4="DELETE FROM CLIENTES WHERE CODCLIENTE = "+str(codA['codigo'])+";"
                        cursor2 = connection.cursor()
                        cursor2.execute(querySql_4)
                        connection.commit()

    
    def consultingNotFound(data):
        
        myobjA = []
        myobjB = []
        myobjRes = []
        j = {}
        i = {}
        server = instanciaBD
        dataBase = nameBD
        conexion="DRIVER={SQL Server};SERVER="+server+";DATABASE="+dataBase+";UID=ICGAdmin;PWD=masterkey"
        querySql="SELECT CODCLIENTE FROM CLIENTES WHERE ((NOMBRECLIENTE = '' AND NOMBRECOMERCIAL = '') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'AAAAA') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'aaaaa') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'EEEEE') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'eeeee') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'IIIII') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'iiiii') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'OOOOO') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'ooooo') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'UUUUUU') OR (SUBSTRING(NOMBRECLIENTE,1,5) = 'uuuuu') OR  LOWER(NOMBRECLIENTE) LIKE '%bbbbb%' OR LOWER(NOMBRECLIENTE) LIKE '%ccccc%' OR LOWER(NOMBRECLIENTE) LIKE '%ddddd%' OR LOWER(NOMBRECLIENTE) LIKE '%fffff%' OR LOWER(NOMBRECLIENTE) LIKE '%ggggg%' OR LOWER(NOMBRECLIENTE) LIKE '%hhhhh%' OR LOWER(NOMBRECLIENTE) LIKE '%jjjjj%' OR LOWER(NOMBRECLIENTE) LIKE '%kkkkk%' OR LOWER(NOMBRECLIENTE) LIKE '%lllll%' OR LOWER(NOMBRECLIENTE) LIKE '%mmmmm%' OR LOWER(NOMBRECLIENTE) LIKE '%nnnnn%' OR LOWER(NOMBRECLIENTE) LIKE '%ppppp%' OR LOWER(NOMBRECLIENTE) LIKE '%qqqqq%' OR LOWER(NOMBRECLIENTE) LIKE '%rrrrr%' OR LOWER(NOMBRECLIENTE) LIKE '%sssss%' OR LOWER(NOMBRECLIENTE) LIKE '%ttttt%' OR LOWER(NOMBRECLIENTE) LIKE '%vvvvv%' OR LOWER(NOMBRECLIENTE) LIKE '%wwwww%' OR LOWER(NOMBRECLIENTE) LIKE '%xxxxx%' OR LOWER(NOMBRECLIENTE) LIKE '%yyyyy%' OR LOWER(NOMBRECLIENTE) LIKE '%zzzzz%') AND DESCATALOGADO = 'F';"
        
        connection = pyodbc.connect(conexion)
        
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obja = collections.OrderedDict()
            querySql_2="SELECT * FROM FACTURASVENTA WHERE CODCLIENTE = "+str(row[0])+";"
            cursor.execute(querySql_2)
            rows_2 = cursor.fetchall()
            for row_2 in rows_2:
                objb = collections.OrderedDict()
                objb = row[0]
                myobjB.append(objb)    
            obja['codigo'] = row[0]
            myobjA.append(obja)
        for codA in myobjA:
            if codA['codigo'] in myobjB:
                querySql_3="UPDATE CLIENTES SET DESCATALOGADO = 'T' WHERE CODCLIENTE = "+str(codA['codigo'])+";"
                cursor2 = connection.cursor()
                cursor2.execute(querySql_3)
                connection.commit()
            else:
                querySql_4="DELETE FROM CLIENTES WHERE CODCLIENTE = "+str(codA['codigo'])+";"
                cursor2 = connection.cursor()
                cursor2.execute(querySql_4)
                connection.commit()
        extraDelete(data)
    
    def deleteDescatalogado(data):
        
        myobjA = []
        myobjB = []
        myobjRes = []
        j = {}
        i = {}
        server = instanciaBD
        dataBase = nameBD
        conexion="DRIVER={SQL Server};SERVER="+server+";DATABASE="+dataBase+";UID=ICGAdmin;PWD=masterkey"
        querySql="SELECT CODCLIENTE FROM CLIENTES WHERE DESCATALOGADO = 'T';"
        
        connection = pyodbc.connect(conexion)
        
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obja = collections.OrderedDict()
            querySql_2="SELECT * FROM FACTURASVENTA WHERE CODCLIENTE = "+str(row[0])+";"
            cursor.execute(querySql_2)
            rows_2 = cursor.fetchall()
            for row_2 in rows_2:
                objb = collections.OrderedDict()
                objb = row[0]
                myobjB.append(objb)    
            obja['codigo'] = row[0]
            myobjA.append(obja)
        for codA in myobjA:
            if codA['codigo'] in myobjB:
                print(codA['codigo'],'in')
            else:
                print(codA['codigo'],'not')
                querySql_4="DELETE FROM CLIENTES WHERE CODCLIENTE = "+str(codA['codigo'])+";"
                cursor2 = connection.cursor()
                cursor2.execute(querySql_4)
                connection.commit()
    
    def reporteStock(email):
        process = json.dumps({'code':serieTienda,'progress':10})
        sio.emit('responseStock',process)
        myobj = []
        responseData = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        print(conexion)
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != '' GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA;"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row in rows:
            obj = collections.OrderedDict()
            obj['cCodigoTienda'] = serieTienda
            obj['cReferencia'] = row[1]
            obj['cCodigoBarra'] = row[2]
            obj['cDescripcion'] = row[3]
            obj['cDepartamento'] = row[4]
            obj['cSeccion'] = row[5]
            obj['cFamilia'] = row[6]
            obj['cSubFamilia'] = row[7]
            obj['cTemporada'] = row[11]
            obj['cTalla'] = row[8]
            obj['cColor'] = row[9]
            obj['cStock'] = row[10]
            
            myobj.append(obj)
        j = json.dumps(myobj)
        print(j)
        process = json.dumps({'code':serieTienda,'progress':50})
        sio.emit('responseStock',process)
        fnExporExcel(j,email)
            
    def fnExporExcel(jsonInput,email):
        process = json.dumps({'code':serieTienda,'progress':60})
        sio.emit('responseStock',process)
        df = pd.read_json(jsonInput)
        df.to_csv(nameExcel, index=False)
        process = json.dumps({'code':serieTienda,'progress':70})
        sio.emit('responseStock',process)
        process = json.dumps({'code':serieTienda,'progress':80})
        sio.emit('responseStock',process)
        fnEnviarEmail(email)

    def proccessNombre(palabras):
        contador = 0
        contadorc = 0
        delete = 0
        for x in palabras:
          if x in ('aeiou'):
            contador+=1
          if x in ('bcdfghjklmnñpqrstvwxyz'):
            contadorc+=1
      
        if contadorc >= 5:
          if palabras != 'cynth' and palabras != 'cryst'and palabras != 'chrys':
              delete = 1

        if contador >= 5:
            delete = 1

        return delete

    def fnKardex(confConsulting):
       myobj = []
       j = {}
       detalle = []
       server = instanciaBD
       dataBase = nameBD
       conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
       querySql="SELECT ACCB.NUMSERIE,ACCB.NUMALBARAN,ACCB.SUALBARAN,ACCB.FECHAMODIFICADO,ACT.BRUTO,ACT.TOTDTOPP,ACT.BASEIMPONIBLE,ACT.TOTIVA,ACT.TOTAL,ALCL.NUMERO_DE_DESPACHO,ALCL.CONTENEDOR,ALCL.TASACAMBIO,ALCL.TOTALGASTO,ALCL.FLETE_Y_ACARREO,ALCL.REGISTRO_SANITARIO,ALCL.MOTIVO,ALCL.TIPO_DE_DOCUMENTO,ALCL.NUM_SERIE_DOC,ALCL.OBSERVACION,ACCB.N FROM ALBCOMPRACAB ACCB INNER JOIN ALBCOMPRATOT ACT ON ACT.SERIE = ACCB.NUMSERIE AND ACT.NUMERO = ACCB.NUMALBARAN AND ACT.N = ACCB.N INNER JOIN ALBCOMPRACAMPOSLIBRES ALCL ON ALCL.NUMSERIE = ACCB.NUMSERIE AND ALCL.NUMALBARAN = ACCB.NUMALBARAN AND ALCL.N = ACCB.N  WHERE ACCB.CODPROVEEDOR = 1 AND ACCB.FECHAALBARAN BETWEEN '"+confConsulting['init']+"' AND '"+confConsulting['end']+"';"
       connection = pyodbc.connect(conexion)
       cursor = connection.cursor()
       cursor.execute("SELECT @@version;")
       row = cursor.fetchone()
       cursor.execute(querySql)
       rows = cursor.fetchall()
       for row in rows:
           obj = collections.OrderedDict()
           obj['cmpSerie'] = str(row[0]) or ""
           obj['cmpNumero'] = str(row[1])  or ""
           obj['cmpSuAlbaran'] = str(row[2])  or ""
           obj['cmpFechaAlbaran'] = str(row[3])  or ""
           obj['dtBruto'] = row[4] or ""
           obj['dtTDescuento'] = row[5] or ""
           obj['dtBaseImponible'] = row[6] or ""
           obj['dtImpuesto'] = row[7] or ""
           obj['dtTotalBruto'] = row[8] or ""
           obj['clDespacho'] = row[9] or ""
           obj['clContenedor'] = row[10] or ""
           obj['clTasaCambio'] = row[11] or ""
           obj['clTotalGasto'] = row[12] or ""
           obj['clFleteAcarreo'] = row[13] or ""
           obj['clRegistroSanitario'] = row[14] or ""
           obj['clMotivo'] = row[15] or ""
           obj['clTipoDocumento'] = row[16] or ""
           obj['clNSerieDocuento'] = row[17] or ""
           obj['clObservacion'] = row[18] or ""
           obj['cmpN'] = str(row[19]) or ""
           obj['detalle'] = []
           
           myobj.append(obj)
       print(json.dumps(myobj))
       j = json.dumps(myobj)
       sio.emit('kardex:get:comprobantes:fr:response',{'id':'AgenteFront','front':j,'configuration':confConsulting}) 
    
    def fnKardexCamposLibres(confConsulting):
       myobj = []
       j = {}
       server = instanciaBD
       dataBase = nameBD
       print(confConsulting)
       conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
       querySql2="UPDATE ALBCOMPRACAMPOSLIBRES SET CONTENEDOR = '"+str(confConsulting['contenedor'])+"', OBSERVACION = '"+str(confConsulting['observacion'])+"', NUMERO_DE_DESPACHO = '"+str(confConsulting['numero_despacho'])+"',TASACAMBIO = '"+str(confConsulting['tasa_cambio'])+"',TOTALGASTO = '"+str(confConsulting['total_gastos'])+"',FLETE_Y_ACARREO = '"+str(confConsulting['flete_acarreo'])+"',REGISTRO_SANITARIO = '"+str(confConsulting['registro_sanitario'])+"',MOTIVO = '"+str(confConsulting['motivo'])+"',TIPO_DE_DOCUMENTO = '"+str(confConsulting['tipo_documento'])+"',NUM_SERIE_DOC = '"+str(confConsulting['numero_serie'])+"' WHERE NUMALBARAN = "+confConsulting['num_albaran']+" AND NUMSERIE = '"+confConsulting['num_serie']+"' AND N = '"+confConsulting['n']+"';"
       print(querySql2)
       connection = pyodbc.connect(conexion)
       cursor = connection.cursor()
       cursor.execute("SELECT @@version;")
       cursor.execute(querySql2)
       connection.commit()
       querySql="SELECT ACCB.NUMSERIE,ACCB.NUMALBARAN,ACCB.SUALBARAN,ACCB.FECHAMODIFICADO,ACT.BRUTO,ACT.TOTDTOPP,ACT.BASEIMPONIBLE,ACT.TOTIVA,ACT.TOTAL,ALCL.NUMERO_DE_DESPACHO,ALCL.CONTENEDOR,ALCL.TASACAMBIO,ALCL.TOTALGASTO,ALCL.FLETE_Y_ACARREO,ALCL.REGISTRO_SANITARIO,ALCL.MOTIVO,ALCL.TIPO_DE_DOCUMENTO,ALCL.NUM_SERIE_DOC,ALCL.OBSERVACION,ACCB.N FROM ALBCOMPRACAB ACCB INNER JOIN ALBCOMPRATOT ACT ON ACT.SERIE = ACCB.NUMSERIE AND ACT.NUMERO = ACCB.NUMALBARAN AND ACT.N = ACCB.N INNER JOIN ALBCOMPRACAMPOSLIBRES ALCL ON ALCL.NUMSERIE = ACCB.NUMSERIE AND ALCL.NUMALBARAN = ACCB.NUMALBARAN AND ALCL.N = ACCB.N  WHERE ACCB.NUMALBARAN = '"+confConsulting['num_albaran']+"' AND ACCB.NUMSERIE = '"+confConsulting['num_serie']+"' AND ACCB.N = '"+confConsulting['n']+"';"
       cursor = connection.cursor()
       cursor.execute("SELECT @@version;")
       row = cursor.fetchone()
       cursor.execute(querySql)
       rows = cursor.fetchall()
       for row in rows:
           obj = collections.OrderedDict()
           obj['cmpSerie'] = str(row[0]) or ""
           obj['cmpNumero'] = str(row[1])  or ""
           obj['cmpSuAlbaran'] = str(row[2])  or ""
           obj['cmpFechaAlbaran'] = str(row[3])  or ""
           obj['dtBruto'] = row[4] or ""
           obj['dtTDescuento'] = row[5] or ""
           obj['dtBaseImponible'] = row[6] or ""
           obj['dtImpuesto'] = row[7] or ""
           obj['dtTotalBruto'] = row[8] or ""
           obj['clDespacho'] = row[9] or ""
           obj['clContenedor'] = row[10] or ""
           obj['clTasaCambio'] = row[11] or ""
           obj['clTotalGasto'] = row[12] or ""
           obj['clFleteAcarreo'] = row[13] or ""
           obj['clRegistroSanitario'] = row[14] or ""
           obj['clMotivo'] = row[15] or ""
           obj['clTipoDocumento'] = row[16] or ""
           obj['clNSerieDocuento'] = row[17] or ""
           obj['clObservacion'] = str(row[18]) or ""
           obj['cmpN'] = str(row[19]) or ""
           obj['detalle'] = []
           
           myobj.append(obj)
       print(json.dumps(myobj))
       j = json.dumps(myobj)

       sio.emit('kardex:post:camposlibres:fr:response',{'id':'AgenteFront','data':j,'configuration':confConsulting}) 


    def fnKardexCuo(confConsulting):
       myobj = []
       j = {}
       detalle = []
       server = instanciaBD
       dataBase = nameBD
       conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
       querySql="DECLARE @DESDE AS DATE\n DECLARE @HASTA AS DATE\n DECLARE @FILTRO AS NVARCHAR(50) \n SELECT @DESDE='"+confConsulting['init']+"' , @HASTA='"+confConsulting['end']+"' , @FILTRO=''\n  SELECT * FROM(\n  SELECT\n 	'VENTA' TABLA\n  , CAST(DATEPART(YEAR,AVC.FECHA) AS NVARCHAR(4))+CASE LEN(DATEPART(MONTH, AVC.FECHA)) WHEN 1 THEN '0' ELSE '' END+CAST(DATEPART(MONTH, AVC.FECHA) AS NVARCHAR(2)) +'01' DOCUMENTO \n 	, CAST(CAST(DATEPART(YEAR,AVC.FECHA) AS NVARCHAR(4))+CASE LEN(DATEPART(MONTH, AVC.FECHA)) WHEN 1 THEN '0' ELSE '' END+CAST(DATEPART(MONTH, AVC.FECHA) AS NVARCHAR(2)) +'01' AS DATE)  FECHA \n   	, 'VENTA DE '+UPPER(DATENAME(MONTH, AVC.FECHA)) COLLATE Latin1_General_CS_AI COMENTARIO \n , ISNULL(MAX(CUO.CUO),'')CUO \n FROM\n ALBVENTACAB AVC\n LEFT JOIN (SELECT DATEPART(YEAR,VALOR) ANYO, DATEPART(MONTH, VALOR) MES, CUO FROM RIP_CUO WHERE TABLA='VENTA') CUO ON DATEPART(YEAR, AVC.FECHA)=CUO.ANYO AND DATEPART(MONTH, AVC.FECHA)=CUO.MES\n WHERE\n AVC.FECHA BETWEEN @DESDE AND @HASTA\n GROUP BY\n DATEPART(YEAR,AVC.FECHA) \n , DATEPART(MONTH, AVC.FECHA)\n ,DATENAME(MONTH, AVC.FECHA)\n \n UNION ALL\n SELECT\n 'COMPRA' TABLA\n , RC.SUALBARAN\n , RC.FECHAALBARAN\n , ISNULL(ACCL.MOTIVO,'-') COMENTARIO \n , ISNULL(CUO.CUO,'') CUO \n FROM\n RIPV_COMPRAS RC\n LEFT JOIN (SELECT VALOR, CUO FROM RIP_CUO WHERE TABLA='COMPRA') CUO ON RC.SUALBARAN=CUO.VALOR COLLATE Modern_Spanish_CI_AS\n INNER JOIN ALBCOMPRACAMPOSLIBRES ACCL ON RC.NUMSERIE=ACCL.NUMSERIE AND RC.NUMALBARAN=ACCL.NUMALBARAN\n       WHERE\n       	RC.FECHAALBARAN BETWEEN @DESDE AND @HASTA\n       GROUP BY\n       	RC.SUALBARAN\n       	, RC.FECHAALBARAN\n       	, ACCL.MOTIVO\n       	, CUO.CUO\n       UNION ALL\n       SELECT \n       	'TRASPASO' TABLA\n       	, TC.SERIE+' '+CAST(TC.NUMERO AS NVARCHAR(5)) DOCUMENTO\n       	, TC.FECHA\n       	, 'TRASPASO DE '+TC.CODALMACENORIGEN+' A '+TC.CODALMACENDESTINO\n       	, ISNULL(CUO.CUO,'') CUO\n       FROM\n       	TRASPASOSCAB TC\n       	INNER JOIN ALMACEN ALM ON TC.CODALMACENORIGEN=ALM.CODALMACEN\n       	INNER JOIN ALMACEN ALM2 ON TC.CODALMACENDESTINO=ALM2.CODALMACEN\n       	LEFT JOIN (SELECT VALOR, CUO FROM RIP_CUO WHERE TABLA='TRASPASO') CUO ON TC.SERIE+' '+CAST(TC.NUMERO AS NVARCHAR(5))=CUO.VALOR COLLATE Modern_Spanish_CI_AS\n       WHERE\n       	TC.FECHA BETWEEN @DESDE AND @HASTA\n       	AND ALM.ESMERMAS=0\n      	AND ALM2.ESMERMAS=0) A\n      ORDER BY        	FECHA"
       connection = pyodbc.connect(conexion)
       cursor = connection.cursor()
       cursor.execute("SELECT @@version;")
       row = cursor.fetchone()
       cursor.execute(querySql)
       rows = cursor.fetchall()
       for row in rows:
           obj = collections.OrderedDict()
           obj['dtTabla'] = str(row[0]) or ""
           obj['dtDocumento'] = str(row[1])  or ""
           obj['dtFecha'] = str(row[2])  or ""
           obj['dtComentario'] = str(row[3])  or ""
           obj['dtCuo'] = str(row[4])  or ""
           obj['dtCuoEdit'] =  ""
           querySql = "SELECT * FROM RIP_CUO WHERE VALOR = '"+str(row[1])+"';"
           connection = pyodbc.connect(conexion)
           cursor = connection.cursor()
           cursor.execute("SELECT @@version;")
           cursor.execute(querySql)
           rows2 = cursor.fetchall()
           print(querySql,len(rows2),rows2)
           obj['dtLenCuo'] = str(len(rows2))
           myobj.append(obj)
       print(json.dumps(myobj))
       j = json.dumps(myobj)
       sio.emit('kardex:get:cuo:fr:response',{'id':'AgenteFront','front':j,'configuration':confConsulting}) 

    def fnKardexCuoInsert(confConsulting):
       myobj = []
       j = {}
       server = instanciaBD
       dataBase = nameBD
       conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
       for into in confConsulting['data']:
           if into['isUpdate'] == 'True' :
               querySql2="UPDATE RIP_CUO SET CUO = '"+into['cuo']+"' WHERE VALOR ='"+into['valor']+"';"
           else:
               querySql2="INSERT INTO RIP_CUO (TABLA,CUO,VALOR)VALUES('"+into['tabla']+"','"+into['cuo']+"','"+into['valor']+"');"
           print(querySql2)
           connection = pyodbc.connect(conexion)
           cursor = connection.cursor()
           cursor.execute("SELECT @@version;")
           cursor.execute(querySql2)
           connection.commit()
       querySql="DECLARE @DESDE AS DATE\n DECLARE @HASTA AS DATE\n DECLARE @FILTRO AS NVARCHAR(50) \n SELECT @DESDE='"+into['init']+"' , @HASTA='"+into['end']+"' , @FILTRO=''\n  SELECT * FROM(\n  SELECT\n 	'VENTA' TABLA\n  , CAST(DATEPART(YEAR,AVC.FECHA) AS NVARCHAR(4))+CASE LEN(DATEPART(MONTH, AVC.FECHA)) WHEN 1 THEN '0' ELSE '' END+CAST(DATEPART(MONTH, AVC.FECHA) AS NVARCHAR(2)) +'01' DOCUMENTO \n 	, CAST(CAST(DATEPART(YEAR,AVC.FECHA) AS NVARCHAR(4))+CASE LEN(DATEPART(MONTH, AVC.FECHA)) WHEN 1 THEN '0' ELSE '' END+CAST(DATEPART(MONTH, AVC.FECHA) AS NVARCHAR(2)) +'01' AS DATE)  FECHA \n   	, 'VENTA DE '+UPPER(DATENAME(MONTH, AVC.FECHA)) COLLATE Latin1_General_CS_AI COMENTARIO \n , ISNULL(MAX(CUO.CUO),'')CUO \n FROM\n ALBVENTACAB AVC\n LEFT JOIN (SELECT DATEPART(YEAR,VALOR) ANYO, DATEPART(MONTH, VALOR) MES, CUO FROM RIP_CUO WHERE TABLA='VENTA') CUO ON DATEPART(YEAR, AVC.FECHA)=CUO.ANYO AND DATEPART(MONTH, AVC.FECHA)=CUO.MES\n WHERE\n AVC.FECHA BETWEEN @DESDE AND @HASTA\n GROUP BY\n DATEPART(YEAR,AVC.FECHA) \n , DATEPART(MONTH, AVC.FECHA)\n ,DATENAME(MONTH, AVC.FECHA)\n \n UNION ALL\n SELECT\n 'COMPRA' TABLA\n , RC.SUALBARAN\n , RC.FECHAALBARAN\n , ISNULL(ACCL.MOTIVO,'-') COMENTARIO \n , ISNULL(CUO.CUO,'') CUO \n FROM\n RIPV_COMPRAS RC\n LEFT JOIN (SELECT VALOR, CUO FROM RIP_CUO WHERE TABLA='COMPRA') CUO ON RC.SUALBARAN=CUO.VALOR COLLATE Modern_Spanish_CI_AS\n INNER JOIN ALBCOMPRACAMPOSLIBRES ACCL ON RC.NUMSERIE=ACCL.NUMSERIE AND RC.NUMALBARAN=ACCL.NUMALBARAN\n       WHERE\n       	RC.FECHAALBARAN BETWEEN @DESDE AND @HASTA\n       GROUP BY\n       	RC.SUALBARAN\n       	, RC.FECHAALBARAN\n       	, ACCL.MOTIVO\n       	, CUO.CUO\n       UNION ALL\n       SELECT \n       	'TRASPASO' TABLA\n       	, TC.SERIE+' '+CAST(TC.NUMERO AS NVARCHAR(5)) DOCUMENTO\n       	, TC.FECHA\n       	, 'TRASPASO DE '+TC.CODALMACENORIGEN+' A '+TC.CODALMACENDESTINO\n       	, ISNULL(CUO.CUO,'') CUO\n       FROM\n       	TRASPASOSCAB TC\n       	INNER JOIN ALMACEN ALM ON TC.CODALMACENORIGEN=ALM.CODALMACEN\n       	INNER JOIN ALMACEN ALM2 ON TC.CODALMACENDESTINO=ALM2.CODALMACEN\n       	LEFT JOIN (SELECT VALOR, CUO FROM RIP_CUO WHERE TABLA='TRASPASO') CUO ON TC.SERIE+' '+CAST(TC.NUMERO AS NVARCHAR(5))=CUO.VALOR COLLATE Modern_Spanish_CI_AS\n       WHERE\n       	TC.FECHA BETWEEN @DESDE AND @HASTA\n       	AND ALM.ESMERMAS=0\n      	AND ALM2.ESMERMAS=0) A\n        ORDER BY        	FECHA"
       connection = pyodbc.connect(conexion)
       cursor = connection.cursor()
       cursor.execute("SELECT @@version;")
       row = cursor.fetchone()
       cursor.execute(querySql)
       rows = cursor.fetchall()
       
       for row in rows:
           obj = collections.OrderedDict()
           obj['dtTabla'] = str(row[0]) or ""
           obj['dtDocumento'] = str(row[1])  or ""
           obj['dtFecha'] = str(row[2])  or ""
           obj['dtComentario'] = str(row[3])  or ""
           obj['dtCuo'] = str(row[4])  or ""
           obj['dtCuoEdit'] =  ""
           querySql = "SELECT * FROM RIP_CUO WHERE VALOR = '"+str(row[1])+"';"
           connection = pyodbc.connect(conexion)
           cursor = connection.cursor()
           cursor.execute("SELECT @@version;")
           row = cursor.fetchone()
           cursor.execute(querySql)
           rows = cursor.fetchall()
           obj['dtLenCuo'] = len(str(rows))
           myobj.append(obj)
               
       j = json.dumps(myobj)
       sio.emit('kardex:post:cuo:fr:response',{'id':'AgenteFront','data':j,'configuration':confConsulting})

    def fnEnviarEmail(email):
        process = json.dumps({'code':serieTienda,'progress':90})
        sio.emit('responseStock',process)
        # Iniciamos los parámetros del script
        remitente = 'itperu.notification@gmail.com'
        destinatarios = [email]
        asunto = asuntoEmail
        cuerpo = 'Este es el contenido del mensaje'
        ruta_adjunto = nameExcel
        nombre_adjunto = nameExcel
    
        # Creamos el objeto mensaje
        mensaje = MIMEMultipart()
    
        # Establecemos los atributos del mensaje
        mensaje['From'] = remitente
        mensaje['To'] = ", ".join(destinatarios)
        mensaje['Subject'] = asunto
    
        # Agregamos el cuerpo del mensaje como objeto MIME de tipo texto
        mensaje.attach(MIMEText(cuerpo, 'plain'))
    
        # Abrimos el archivo que vamos a adjuntar
        archivo_adjunto = open(ruta_adjunto, 'rb')
    
        # Creamos un objeto MIME base
        adjunto_MIME = MIMEBase('application', 'octet-stream')
        # Y le cargamos el archivo adjunto
        adjunto_MIME.set_payload((archivo_adjunto).read())
        # Codificamos el objeto en BASE64
        encoders.encode_base64(adjunto_MIME)
        # Agregamos una cabecera al objeto
        adjunto_MIME.add_header('Content-Disposition', "attachment; filename= %s" % nombre_adjunto)
        # Y finalmente lo agregamos al mensaje
        mensaje.attach(adjunto_MIME)
    
        # Creamos la conexión con el servidor
        sesion_smtp = smtplib.SMTP('smtp.gmail.com', 587)
    
        # Ciframos la conexión
        sesion_smtp.starttls()
    
        # Iniciamos sesión en el servidor
        sesion_smtp.login('itperu.notification@gmail.com','zgbiaxbnhulwlvqk')
    
        # Convertimos el objeto mensaje a texto
        texto = mensaje.as_string()
    
        # Enviamos el mensaje
        sesion_smtp.sendmail(remitente, destinatarios, texto)
    
        # Cerramos la conexión
        sesion_smtp.quit()
        process = json.dumps({'code':serieTienda,'progress':100})
        sio.emit('responseStock',process)
    
    
    msvcrt.getch()
