import socketio
sio = socketio.Client()
import socket
import time

def verify_conexion() :
    try:
      sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
      host = '190.117.82.193'
      port = 21
      result = sock.connect_ex((host, port))

      if result == 0:
          sio.emit('conexion:serverICG',[{'code': '9F','isConect' : '1'}])
      else:
          sio.emit('conexion:serverICG',[{'code': '9F','isConect' : '0'}])

      sock.close()
     
    except:
      print("An exception occurred")   


while True:
   verify_conexion()
   time.sleep(3)