CREATE DATABASE RRHH;
USE RRHH;

CREATE TABLE TB_R_TIPO_CONTRATO(
ID_R_TIPO_CONTRATO INT AUTO_INCREMENT,
DESCRIPCION VARCHAR(100),
PRIMARY KEY(ID_R_TIPO_CONTRATO)
);

INSERT INTO TB_R_TIPO_CONTRATO(DESCRIPCION)VALUES('A MODALIDAD');
INSERT INTO TB_R_TIPO_CONTRATO(DESCRIPCION)VALUES('PART TIME');

CREATE TABLE TB_R_TIPO_DOC(
ID_R_TIPO_DOC INT AUTO_INCREMENT,
DESCRIPCION VARCHAR(100),
PRIMARY KEY(ID_R_TIPO_DOC)
);

INSERT INTO TB_R_TIPO_DOC(DESCRIPCION)VALUES('DNI');
INSERT INTO TB_R_TIPO_DOC(DESCRIPCION)VALUES('CE');
INSERT INTO TB_R_TIPO_DOC(DESCRIPCION)VALUES('PTP');

CREATE TABLE TB_R_PLAZO_CONTRATO(
ID_R_PLAZO_CONTRATO INT AUTO_INCREMENT,
DESCRIPCION VARCHAR(100),
PRIMARY KEY(ID_R_PLAZO_CONTRATO)
);

INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('tres (03) meses');
INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('un (01) mes');
INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('un (01) mes y dieciseis (16) días');
INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('un (01) mes y diez (10) días');
INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('un (01) mes y once (11) días');
INSERT INTO TB_R_PLAZO_CONTRATO(DESCRIPCION)VALUES('un (01) mes y veinte (20) días');

CREATE TABLE TB_R_CARGO_LABORAL(
ID_CARGO_LABORA INT AUTO_INCREMENT,
DESCRIPCION VARCHAR(100),
PRIMARY KEY(ID_CARGO_LABORA)
);

INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Administrador de TI');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Asistente de Contabilidad');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Asistente de Recursos Humanos');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Asistente de Visual');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Asistente Social');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Asociado de Unidad de Servicio');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Auxiliar de Contabilidad 1');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Auxiliar de Contabilidad 2');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Auxiliar de Recursos Humanos');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Bodeguero');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Cajero de Unidad de Servicio');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Coordinador Jr de Marketing');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('CUSTOMER CARE');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Especialista Fitting Bra');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('FIELD LEADER');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Gerente de Tienda');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Gerente de Ventas');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Gerente Junior de Categoria');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Jefe de Contabilidad');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Jefe de Recursos Humanos');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Jefe de Tesoreria');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Sub Gerente de Unidad de Servicio');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Sub Gerente Junior de Unidad de Servicio');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Supervisor de Operaciones');
INSERT INTO TB_R_CARGO_LABORAL(DESCRIPCION)VALUES('Gerente de Mercado y Visual');

CREATE TABLE TB_R_OBJETIVO_CONTRATO(
ID_OBJETO_CONTRATO INT AUTO_INCREMENT,
ID_CARGO_LABORA_OP INT,
DESCRIPCION VARCHAR(100),
PRIMARY KEY(ID_OBJETO_CONTRATO),
FOREIGN KEY(ID_CARGO_LABORA_OP) REFERENCES TB_R_CARGO_LABORAL(ID_CARGO_LABORA)
);
SELECT * FROM TB_R_CARGO_LABORAL;
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(1,'Brindar soporte y soluciones oportunas en materia de TI a los diferentes usuarios en las unidades de servicio y oficinas adminstrativas asegurando el correcto flujo de información.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(2,'Asiste al area, llevando las cuentas de manera ordenada, consisa y correcta de las unidades a su cargo. Emite reportes contables y demas afines a su puesto.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(3,'Asistir al area en temas de su competencia afines al puesto. Asegurar el correcto control de los contratos de los trabajadores en cuanto a su renovacion, adecuada modalidad y demas. Control y gestión de la data vacacional, al respecto coordina con todas las unidades y tesorería para su pago correcto y oportuno.  ');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(4,'Asiste a la Gerencia de Mercadeo y Visual, asegura que las campañas se lleve tal y como lo indica la marca.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(5,'Realizar la gestión y tramite de los recuperos de subsidios, asegurar una correcta y oportuna atención a los trabajadores en materia de Bienestar Social.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(6,'Realizar la exhibición y ventas de los productos a los clientes finales brindandoles una experiencia de compra que supere sus expectativas en cuanto a trato diferenciado .');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(10,'Con la capacidad y habilidad de planificar sus tiempos, orientado a resultados; Realizar el apoyo y soporte a todos los clientes internos con los que se relaciona a lo largo de toda la cadena de abastecimiento asegurando la recepción y el despacho optimos. ');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(11,'Con las aptitudes y capacidades necesarias para desarrollar las labores del puesto tales como realizar todas las transacciones de venta diaria, así como los respectivos reportes diarios de caja, asegurandose de llevar un minucioso y cuidadoso control de los movimientos de la misma.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(14,'Ofrecer al cliente una experiencia cautivadora con la marca que sea de primera categoria lo que permita fomentar la lealtad del cliente permitiendo ventas consistentes que aseguren el crecimiento de la unidad.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(25,'Proporcionar un liderazgo que impulsa los resultados totales de la tienda con la propiedad específica para presentación del producto, su ciclo de vida y mercancía. El Gerente de Mercadeo y Visual impulsa los resultados desarrollando y ejecutando planes de acción y estrategia a largo y corto plazo. Es el encargado de la entrega de la marca, apoya el crecimiento en ventas y servicio y garantiza la máxima productividad, rentabilidad y cumplimiento de las políticas y procedimientos de la empresa.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(17,'Impulsar el crecimiento de ventas como líder de la experiencia del cliente en el piso de ventas, teniendo la responsabilidad principal de liderar y desarrollar informes directos. Es responsable de lograr los resultados mediante el crecimiento y el desarrollo del equipo de ventas en consecusión del éxito individual y de equipo.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(19,'Dirigir, planificar, organizar y gestionar integralmente el area asegurando la correcta ejecución de los procesos contables y financieros de la organización.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(20,'Dirigir, planificar, organizar y gestionar integralmente el area asegurando la correcta ejecución de los procesos de vinculación, remuneraciones, seguridad y salud en el trabajo entre otras que afecten a la organización.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(21,'Asegurar las correctas y oportunas transacciones financieras propias del área.');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(22,'Asegurar la supervisión, control y correcta ejecución de todas las actividades en la Unidad, con el objetivo de cumplir y superar las metas de ventas con minimas pérdidas y cero accidentes que afecten las horas hombre (HH).');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(23,'Coadyuvar a la Sub Gerencia en la supervisión, control y correcta ejecución de todas las actividades en la Unidad, con el objetivo de cumplir y superar las metas de ventas con minimas pérdidas y cero accidentes que afecten las horas hombre (HH).');
INSERT INTO TB_R_OBJETIVO_CONTRATO(DESCRIPCION)VALUES(24,'Dirige, planifica, controla y supervisa las diferentes unidades de servicio a su cargo. Asegurando primordialmente el alcance de las objetivos de ventas, así como facilitando y articulando para que los Sub Gerentes puedan desarrollar sus labores conforme al procedimiento establecido.');


CREATE TABLE TB_R_TRABAJADOR(
ID_R_TRAB INT AUTO_INCREMENT,
NOMBRES VARCHAR(100),
AP_PATERNO  VARCHAR(100),
AP_MATERNO VARCHAR(100),
NOMENCLATURA VARCHAR(20),
ID_R_TIPO_CONTRATO_OP INT, -- TABLA TIPOS DE CONTRATOS
ID_R_TIPO_DOC_OP INT, -- TABLA TIPOS DE DOCUMENTOS // DNI/CE/PTP
ID_R_PLAZO_CONTRATO_OP INT,
NUMERO_DOC VARCHAR(30),
ESTADO  VARCHAR(50),
FECHA_INICIO VARCHAR(50),
FECHA_FIN VARCHAR(50),
FECHA_FIRMA_CONTRATO VARCHAR(50),
DIRECCION VARCHAR(200),
ID_UBIGEO_DISTRITO_OP INT,
ID_UBIGEO_PROVINCIA_OP INT,
ID_CARGO_LABORA_OP INT,
REMUNERACION FLOAT,
REMUNERACION_DESCRIPCION VARCHAR(200),
IS_CARGO_CONFIANZA BOOLEAN,
IS_PERIODO_PRUEBA BOOLEAN,
CORREO VARCHAR(100),
TELEFONO  VARCHAR(20),
FECHA_NACIMIENTO VARCHAR(50),
ID_OBJETO_CONTRATO_OP INT,
PRIMARY KEY(ID_R_TRAB),
FOREIGN KEY(ID_R_TIPO_CONTRATO_OP) REFERENCES TB_R_TIPO_CONTRATO(ID_R_TIPO_CONTRATO),
FOREIGN KEY(ID_R_TIPO_DOC_OP) REFERENCES TB_R_TIPO_DOC(ID_R_TIPO_DOC),
FOREIGN KEY(ID_R_PLAZO_CONTRATO_OP) REFERENCES TB_R_PLAZO_CONTRATO(ID_R_PLAZO_CONTRATO),
FOREIGN KEY(ID_UBIGEO_DISTRITO_OP) REFERENCES TB_UBIGEO(ID_UBIGEO_DISTRITO), -- FALTA CREAR LA TABLA UBIGEO
FOREIGN KEY(ID_UBIGEO_PROVINCIA_OP) REFERENCES TB_UBIGEO(ID_UBIGEO_PROVINCIA),-- FALTA CREAR LA TABLA UBIGEO
FOREIGN KEY(ID_CARGO_LABORA_OP) REFERENCES TB_R_CARGO_LABORAL(ID_CARGO_LABORA),
FOREIGN KEY(ID_OBJETO_CONTRATO_OP) REFERENCES TB_R_OBJETIVO_CONTRATO(ID_OBJETO_CONTRATO)
);
