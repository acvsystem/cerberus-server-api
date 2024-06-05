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

res = requests.post('http://159.65.226.239:4200/frontRetail/search/configuration/agente',data={"mac":gma()})
configuration = res.json()
print(configuration)
if len(configuration) > 0:
    parametros = configuration[0]
    serieTienda = parametros['SERIE_TIENDA']
    instanciaBD = parametros['DATABASE_INSTANCE']
    nameBD = parametros['DATABASE_NAME']
    codFactura = parametros['COD_TIPO_FAC']
    codBoleta = parametros['COD_TIPO_BOL']
    hash = 'U2FsdGVkX19N0xc+gKZEcnXvJc/aJ0AySfiJ7XubWHxfkZ5fWetzn7n1OD+Lebp3jr1yk3qKnMUBdKy5nDZHHw=='
    sio.connect('http://159.65.226.239:4200', transports=['websocket'], headers={'code': serieTienda,'hash': hash })

    @sio.event
    def consultingToFront(data):
        consultingData()

    def consultingData():
        myobj = []
        j = {}
        server = instanciaBD
        dataBase = nameBD
        conexion="DRIVER={SQL Server};SERVER="+server+";DATABASE="+dataBase+";UID=pereport;PWD=reportpe"
        nowDate=datetime.today().strftime('%Y-%m-%d')
        lastDate = datetime.today()+timedelta(days=-1)
        shift = timedelta(max(1, (lastDate.weekday() + 6) % 7))
        lastDate = lastDate.strftime('%Y-%m-%d')
        querySql="SELECT CASE TIPOSDOC.TIPODOC WHEN "+repr(codFactura)+" THEN SUBSTRING(CONCAT('F',NUMSERIE),1,len(CONCAT('F',NUMSERIE))-1) WHEN "+repr(codBoleta)+" THEN SUBSTRING(CONCAT('B',NUMSERIE),1,len(CONCAT('B',NUMSERIE))-1) ELSE SUBSTRING(CONCAT(CONCAT(SUBSTRING(NUMSERIE,4,1),NUMSERIE),NUMSERIE),1,len(NUMSERIE)) END AS NUMSERIE, NUMFACTURA,TIPOSDOC.DESCRIPCION, FORMAT(FECHA,'yyyy-MM-dd') AS FECHA FROM FACTURASVENTA INNER JOIN TIPOSDOC ON TIPOSDOC.TIPODOC = FACTURASVENTA.TIPODOC WHERE FECHA BETWEEN '"+lastDate+"' AND '"+nowDate+"';"
        print(querySql)
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
        print(j)
        sio.emit('petitionFront',j)





