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

res = requests.post('http://38.187.8.22:3200/frontRetail/search/configuration/agente',data={"mac":gma()})
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
    
    sio.connect('http://38.187.8.22:3200', transports=['websocket'], headers={'code': serieTienda})

    @sio.event
    def disconnect():
        print('disconnected from server')

    @sio.event
    def consultingToFront(data):
        consultingData()

    @sio.event
    def searchTransaction(data):
        consultingTransaction()

    @sio.event
    def searchCantCliente(data):
        consultingClient(data)

    @sio.event
    def limpiarCliente(data):
        consultingNotFound(data)
        deleteDescatalogado('data')
        consultingClient(data)

    @sio.event
    def searchStockTest(email,codeList):
        rows = codeList
        for row in rows:
            if row['code'] == serieTienda:
                reporteStock(email)

    @sio.event
    def searchStockTable(codeList,barcode):
        rows = codeList
        for row in rows:
            if row['code'] == serieTienda:
                fnSendDataFront(barcode)  

    

    def fnSendDataFront(barcode):
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
            querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != '' AND SFM.DESCRIPCION != 'INGRESOS' AND SFM.DESCRIPCION != 'GASTOS' GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA WHERE AL.CODBARRAS = '"+barcode+"';"
        else:  
            querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != '' AND SFM.DESCRIPCION != 'INGRESOS' AND SFM.DESCRIPCION != 'GASTOS' GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA;"
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
    
            myobj.append(obj)
        print(myobj)
        x = requests.post('http://38.187.8.22:3200/frontRetail/search/stock', json = myobj)
        print(x)
        
    
    def consultingData():
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
        sio.emit('petitionFront',j)
    
    def consultingTransaction():
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
        print(j)
        sio.emit('resTransaction',j)
    
    def consultingClient(data):
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        count = extraCliente(data)
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=ICGAdmin;PWD=masterkey'
        
        querySql="SELECT count(*) FROM CLIENTES WHERE ((NOMBRECLIENTE = '' AND NOMBRECOMERCIAL = '') OR (SUBSTRING(NOMBRECLIENTE,1,3) = 'AAA')) AND DESCATALOGADO = 'F';"
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
        myobj.append(obj)
        j = json.dumps(myobj)
        print(j)
        sio.emit('resClient',j)

    def consultingClient():
        myobj = []
        myobjProcess = []
        j = {}
        count = 0
        count_1 = 0
        count_2 = 0
        server = 'VSFAJPBD\\VSFAJP'
        dataBase = 'VSFAPR'
        conexion='DRIVER={SQL Server};SERVER='+server+';DATABASE='+dataBase+';UID=pereport;PWD=reportpe'
    
        querySql="SELECT CODCLIENTE FROM CLIENTES WHERE ((NOMBRECLIENTE = '' AND NOMBRECOMERCIAL = '') OR (SUBSTRING(NOMBRECLIENTE,1,3) = 'AAA')) AND DESCATALOGADO = 'F';"
        connection = pyodbc.connect(conexion)
        cursor = connection.cursor()
        cursor.execute("SELECT @@version;")
        row1 = cursor.fetchone()
        cursor.execute(querySql)
        rows = cursor.fetchall()
        for row1 in rows:
            count_1 = row1[0]
            processClientesSQL(row1[0])
            
        querySql2="SELECT LOWER(SUBSTRING(NOMBRECLIENTE, 1, 5)) AS NOMBRE,CODCLIENTE FROM CLIENTES;"
        cursor2 = connection.cursor()
        cursor2.execute("SELECT @@version;")
        row2 = cursor2.fetchone()
        cursor2.execute(querySql2)
        rows2 = cursor2.fetchall()
        for row2 in rows2:
            count += proccessNombre(row2[0])
            if proccessNombre(row2[0]) == 1:
                processClientesSQL(row2[1])

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
        querySql="SELECT CODCLIENTE FROM CLIENTES WHERE ((NOMBRECLIENTE = '' AND NOMBRECOMERCIAL = '') OR (SUBSTRING(NOMBRECLIENTE,1,3) = 'AAA')) AND DESCATALOGADO = 'F';"
        
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
        querySql="DECLARE @CODALMACEN AS NVARCHAR(3)=(SELECT DISTINCT VALOR FROM PARAMETROS WHERE CLAVE='ALDEF');SELECT ART.CODARTICULO,ART.REFPROVEEDOR AS REFERENCIA,AL.CODBARRAS AS CODIGO_BARRAS,ART.DESCRIPCION AS DESCRIPCION,DPTO.DESCRIPCION AS DEPARTAMENTO,SEC.DESCRIPCION AS SECCION,FM.DESCRIPCION AS FAMILIA,SFM.DESCRIPCION AS SUBFAMILIA,S.TALLA AS TALLA,S.COLOR AS COLOR,S.STOCK AS STOCK,ART.TEMPORADA AS TEMPORADA FROM ARTICULOS ART WITH(NOLOCK) RIGHT JOIN FAMILIAS FM WITH(NOLOCK) ON ART.DPTO = FM.NUMDPTO AND  ART.SECCION = FM.NUMSECCION AND ART.FAMILIA = FM.NUMFAMILIA RIGHT JOIN SUBFAMILIAS SFM WITH(NOLOCK) ON ART.DPTO = SFM.NUMDPTO AND  ART.SECCION = SFM.NUMSECCION AND ART.FAMILIA = SFM.NUMFAMILIA AND ART.SUBFAMILIA = SFM.NUMSUBFAMILIA INNER JOIN ARTICULOSLIN AL WITH(NOLOCK) ON ART.CODARTICULO=AL.CODARTICULO LEFT JOIN DEPARTAMENTO DPTO WITH(NOLOCK) ON ART.DPTO=DPTO.NUMDPTO LEFT JOIN SECCIONES SEC WITH(NOLOCK) ON ART.DPTO=SEC.NUMDPTO AND ART.SECCION=SEC.NUMSECCION LEFT JOIN STOCKS S WITH(NOLOCK) ON S.CODARTICULO=AL.CODARTICULO AND S.COLOR=AL.COLOR AND S.TALLA=AL.TALLA AND S.CODALMACEN=@CODALMACEN LEFT JOIN RIP.RIP_FSTOCK_ARTICULO_FECHA(GETDATE(), @CODALMACEN) S2 ON S2.CODARTICULO=AL.CODARTICULO AND S2.COLOR=AL.COLOR AND S2.TALLA=AL.TALLA WHERE DPTO.NUMDPTO != '96' AND DPTO.NUMDPTO != '97' AND ART.REFPROVEEDOR NOT LIKE '%-1' AND AL.CODBARRAS NOT LIKE '%-1' AND S.TALLA != '' AND S.COLOR != '' AND S.STOCK != '' AND SFM.DESCRIPCION != 'INGRESOS' AND SFM.DESCRIPCION != 'GASTOS' GROUP BY ART.CODARTICULO,ART.REFPROVEEDOR,AL.CODBARRAS,ART.DESCRIPCION,DPTO.DESCRIPCION,SEC.DESCRIPCION,FM.DESCRIPCION,SFM.DESCRIPCION,S.TALLA,S.COLOR,S.STOCK,ART.DPTO,ART.SECCION,ART.FAMILIA,ART.SUBFAMILIA,ART.TEMPORADA;"
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
    
    
    consultingData()
    consultingTransaction()
    msvcrt.getch()
