-- ================================================================
-- SQL MAESTRO — ALUMNOS ÚNICOS + FAMILIAS + APODERADOS
-- Ejecutar los bloques EN ORDEN en el SQL Editor de Supabase.
-- ================================================================
-- ESTRUCTURA DE FAMILIAS PLANIFICADA:
--   2 grupos de 4 hermanos
--   6 grupos de 3 hermanos
--   1 grupo de mellizos (mismo curso, misma fecha)
--  25 grupos de 2 hermanos
-- ================================================================
 
 
-- ================================================================
-- BLOQUE 1: RENOMBRAR TODOS LOS ALUMNOS CON NOMBRES ÚNICOS
-- Conserva IDs 1,2,3,4 (alumnos originales de 1° Medio).
-- Asigna nombres chilenos únicos + fechas de nacimiento correctas.
-- ================================================================
 
DO $$
DECLARE
  rec      RECORD;
  cnt      INTEGER := 0;
  año_nac  INTEGER;
  mes_nac  INTEGER;
  dia_nac  INTEGER;
 
  -- 50 nombres masculinos chilenos
  nm TEXT[] := ARRAY[
    'Diego','Sebastián','Felipe','Ignacio','Cristóbal','Benjamín','Emilio',
    'Claudio','Javier','Pablo','Marco','Luciano','Agustín','Bastián','Esteban',
    'Mauricio','Sergio','Carlos','Víctor','Luis','Roberto','Miguel','Hernán',
    'Eduardo','Fernando','Gonzalo','Marcelo','Héctor','Raúl','César','Oscar',
    'Manuel','Alfredo','Álvaro','Bruno','Camilo','Daniel','Enrique','Fabián',
    'Gabriel','Hugo','Ismael','Jaime','Kevin','Leonardo','Maximiliano',
    'Nicolás','Orlando','Patricio','Rubén'
  ];
  -- 50 nombres femeninos chilenos
  nf TEXT[] := ARRAY[
    'Sofía','Emilia','Isabella','Antonia','Francisca','Fernanda','Renata',
    'Daniela','Bárbara','Alejandra','Cecilia','Beatriz','Lorena','Marcela',
    'Romina','Natalia','Pilar','Rocío','Ximena','Catalina','Trinidad',
    'Florencia','Pía','Carla','Verónica','Patricia','Claudia','Sandra',
    'Mónica','Gloria','Carmen','Rosa','Elena','Jacqueline','Soledad',
    'Angélica','Belén','Débora','Esperanza','Giselle','Helena','Inés',
    'Jessica','Karen','Leslie','Macarena','Nadia','Olga','Pamela','Tamara'
  ];
  -- 58 apellidos paternos
  app TEXT[] := ARRAY[
    'Araya','Bravo','Campos','Delgado','Espinoza','Farías','Garrido','Ibáñez',
    'Jara','Lagos','Medina','Navarrete','Ojeda','Pizarro','Quiroga','Reyes',
    'Sandoval','Tapia','Urrutia','Valenzuela','Vivanco','Yáñez','Zamora',
    'Acuña','Ceballos','Donoso','Escobar','Figueroa','Guajardo','Henríquez',
    'Illanes','Letelier','Merino','Opazo','Palomino','Riquelme','Salas',
    'Toro','Uribe','Vera','Aravena','Barría','Cáceres','Durán','Fuenzalida',
    'Grandón','Huerta','Insunza','Jorquera','Lira','Mansilla','Naranjo',
    'Ortiz','Peña','Quiñones','Robles','Saavedra','Troncoso'
  ];
  -- 55 apellidos maternos
  apm TEXT[] := ARRAY[
    'Araneda','Bustos','Cáceres','Elgueta','Fuenzalida','Gómez','Huerta',
    'Infante','Jorquera','Leiva','Mena','Novoa','Ortega','Palma','Quezada',
    'Robles','Salazar','Uribe','Vera','Alvarado','Barriga','Cid','Dávila',
    'Encina','Gaete','Henríquez','Irarrázaval','Kehr','Mellado','Núñez',
    'Olguín','Paredes','Ríos','Sepúlveda','Toro','Varas','Westermeyer',
    'Yunge','Zúñiga','Aguilera','Baeza','Contreras','Díaz','Fuentealba',
    'González','Herrera','Iglesias','Jofré','Krause','López','Mansilla',
    'Naranjo','Olivares','Pérez','Quiroz','Poblete'
  ];
 
  i_n  INTEGER;  -- índice nombre
  i_pp INTEGER;  -- índice apellido paterno
  i_pm INTEGER;  -- índice apellido materno
  nom  TEXT;
 
BEGIN
  FOR rec IN
    SELECT a.id, c.nombre AS cnombre
    FROM alumnos a
    JOIN cursos c ON a.id_curso = c.id
    WHERE a.id NOT IN (1,2,3,4)   -- conservar alumnos originales
    ORDER BY c.id, a.id
  LOOP
    cnt := cnt + 1;
 
    -- Índices con períodos distintos para garantizar unicidad
    -- LCM(50,58,55) = 31900 >> 280 alumnos → sin repeticiones
    i_n  := ((cnt - 1) % 50) + 1;
    i_pp := ((cnt - 1) % 58) + 1;
    i_pm := ((cnt + 17) % 55) + 1;
 
    IF cnt % 2 = 1 THEN
      nom := nm[i_n] || ' ' || app[i_pp] || ' ' || apm[i_pm];
    ELSE
      nom := nf[i_n] || ' ' || app[i_pp] || ' ' || apm[i_pm];
    END IF;
 
    -- Año de nacimiento según curso
    año_nac := CASE rec.cnombre
      WHEN 'Pre-Kínder (NT1)' THEN 2021
      WHEN 'Kínder (NT2)'     THEN 2020
      WHEN '1° Básico'        THEN 2019
      WHEN '2° Básico'        THEN 2018
      WHEN '3° Básico'        THEN 2017
      WHEN '4° Básico'        THEN 2016
      WHEN '5° Básico'        THEN 2015
      WHEN '6° Básico'        THEN 2014
      WHEN '7° Básico'        THEN 2013
      WHEN '8° Básico'        THEN 2012
      WHEN '1° Medio'         THEN 2011
      WHEN '2° Medio'         THEN 2010
      WHEN '3° Medio'         THEN 2009
      WHEN '4° Medio'         THEN 2008
      ELSE 2015
    END;
 
    mes_nac := (cnt % 12) + 1;
    dia_nac := (cnt % 28) + 1;
 
    UPDATE alumnos
    SET nombre_completo  = nom,
        fecha_nacimiento = make_date(año_nac, mes_nac, dia_nac)
    WHERE id = rec.id;
 
  END LOOP;
  RAISE NOTICE '✅ % alumnos renombrados con fechas de nacimiento correctas.', cnt;
END;
$$;
 
 
-- ================================================================
-- BLOQUE 2: CREAR GRUPOS DE HERMANOS
-- Solo se cambian los apellidos. El primer nombre lo asignó
-- el Bloque 1, lo conservamos para tener nombres distintos.
-- ================================================================
 
-- ─── GRUPO A — 4 HERMANOS "Vargas Morales" ───────────────────────
-- Pre-K(281) → Kínder(301) → 1°B(321) → 2°B(341)
-- Edades aprox: 5, 6, 7, 8 años  → diferencias de 1 a 3 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Vargas Morales'
WHERE id IN (281, 301, 321, 341);
 
-- ─── GRUPO B — 4 HERMANOS "Herrera Andrade" ─────────────────────
-- 5°B(401) → 6°B(421) → 7°B(441) → 8°B(461)
-- Edades aprox: 11, 12, 13, 14 años → diferencias de 1 a 3 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Herrera Andrade'
WHERE id IN (401, 421, 441, 461);
 
-- ─── GRUPO C — 3 HERMANOS "Rojas Espinoza" ──────────────────────
-- Kínder(302) → 2°B(342) → 4°B(382)  — diferencias: 2, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Rojas Espinoza'
WHERE id IN (302, 342, 382);
 
-- ─── GRUPO D — 3 HERMANOS "Lagos Fuentes" ───────────────────────
-- 1°B(322) → 3°B(363) → 5°B(402)  — diferencias: 2, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Lagos Fuentes'
WHERE id IN (322, 363, 402);
 
-- ─── GRUPO E — 3 HERMANOS "Castro Medina" ───────────────────────
-- 2°B(343) → 4°B(383) → 6°B(422)  — diferencias: 2, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Castro Medina'
WHERE id IN (343, 383, 422);
 
-- ─── GRUPO F — 3 HERMANOS "Silva Tapia" ─────────────────────────
-- 3°B(364) → 6°B(423) → 8°B(462)  — diferencias: 3, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Silva Tapia'
WHERE id IN (364, 423, 462);
 
-- ─── GRUPO G — 3 HERMANOS "Araya Sepúlveda" ─────────────────────
-- 4°B(384) → 7°B(442) → 1°M(481)  — diferencias: 3, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Araya Sepúlveda'
WHERE id IN (384, 442, 481);
 
-- ─── GRUPO H — 3 HERMANOS "Gutiérrez Pinto" ─────────────────────
-- 5°B(403) → 8°B(463) → 2°M(496)  — diferencias: 3, 2 años ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Gutiérrez Pinto'
WHERE id IN (403, 463, 496);
 
-- ─── MELLIZOS — "Ojeda Carvallo" (mismo curso, misma fecha) ─────
-- Ambos en 3°B. Apellidos iguales, primer nombre distinto (asignado por Bloque 1). ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Ojeda Carvallo',
                   fecha_nacimiento = '2017-08-12'
WHERE id IN (361, 362);
 
-- ─── 25 GRUPOS DE 2 HERMANOS ────────────────────────────────────
 
-- G01 "Muñoz Torres":       Pre-K(283) + 3°B(365)   — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Muñoz Torres'
WHERE id IN (283, 365);
 
-- G02 "Díaz Álvarez":       Pre-K(284) + 4°B(385)   — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Díaz Álvarez'
WHERE id IN (284, 385);
 
-- G03 "Pérez Garrido":      Kínder(303) + 3°B(366)  — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Pérez Garrido'
WHERE id IN (303, 366);
 
-- G04 "González Ibáñez":    Kínder(304) + 4°B(386)  — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' González Ibáñez'
WHERE id IN (304, 386);
 
-- G05 "Martínez Pino":      Kínder(305) + 5°B(404)  — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Martínez Pino'
WHERE id IN (305, 404);
 
-- G06 "Rodríguez Navarro":  1°B(323) + 4°B(387)     — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Rodríguez Navarro'
WHERE id IN (323, 387);
 
-- G07 "Fernández Quiroga":  1°B(324) + 5°B(405)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Fernández Quiroga'
WHERE id IN (324, 405);
 
-- G08 "Torres Reyes":       1°B(325) + 6°B(424)     — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Torres Reyes'
WHERE id IN (325, 424);
 
-- G09 "Soto Sandoval":      2°B(344) + 5°B(406)     — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Soto Sandoval'
WHERE id IN (344, 406);
 
-- G10 "Flores Tapia":       2°B(345) + 6°B(425)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Flores Tapia'
WHERE id IN (345, 425);
 
-- G11 "Morales Urrutia":    2°B(346) + 7°B(443)     — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Morales Urrutia'
WHERE id IN (346, 443);
 
-- G12 "Contreras Valenzuela": 3°B(367) + 7°B(444)   — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Contreras Valenzuela'
WHERE id IN (367, 444);
 
-- G13 "Ramírez Vivanco":    3°B(368) + 8°B(464)     — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Ramírez Vivanco'
WHERE id IN (368, 464);
 
-- G14 "Miranda Yáñez":      4°B(388) + 8°B(465)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Miranda Yáñez'
WHERE id IN (388, 465);
 
-- G15 "Jiménez Acuña":      4°B(389) + 1°M(486)     — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Jiménez Acuña'
WHERE id IN (389, 486);
 
-- G16 "Álvarez Donoso":     5°B(407) + 1°M(483)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Álvarez Donoso'
WHERE id IN (407, 483);
 
-- G17 "Sepúlveda Escobar":  5°B(408) + 2°M(497)     — 5 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Sepúlveda Escobar'
WHERE id IN (408, 497);
 
-- G18 "Núñez Figueroa":     6°B(426) + 1°M(484)     — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Núñez Figueroa'
WHERE id IN (426, 484);
 
-- G19 "Pizarro Guajardo":   6°B(427) + 2°M(498)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Pizarro Guajardo'
WHERE id IN (427, 498);
 
-- G20 "Vera Henríquez":     7°B(445) + 2°M(499)     — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Vera Henríquez'
WHERE id IN (445, 499);
 
-- G21 "Bravo Illanes":      7°B(446) + 3°M(516)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Bravo Illanes'
WHERE id IN (446, 516);
 
-- G22 "Campos Jara":        8°B(466) + 3°M(517)     — 3 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Campos Jara'
WHERE id IN (466, 517);
 
-- G23 "Delgado Lagos":      8°B(467) + 4°M(536)     — 4 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Delgado Lagos'
WHERE id IN (467, 536);
 
-- G24 "Espinoza Medina":    1°M(485) + 3°M(518)     — 2 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Espinoza Medina'
WHERE id IN (485, 518);
 
-- G25 "Farías Navarrete":   2°M(500) + 4°M(537)     — 2 años dif ✓
UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Farías Navarrete'
WHERE id IN (500, 537);
 
 
-- ================================================================
-- BLOQUE 3: VERIFICAR HERMANOS (debe mostrar todos los grupos)
-- ================================================================
 
WITH aps AS (
  SELECT id, nombre_completo, id_curso, fecha_nacimiento,
    split_part(nombre_completo,' ', array_length(string_to_array(nombre_completo,' '),1)-1) AS ap_p,
    split_part(nombre_completo,' ', array_length(string_to_array(nombre_completo,' '),1))   AS ap_m
  FROM alumnos
)
SELECT
  ap_p || ' ' || ap_m          AS familia,
  COUNT(*)                      AS hermanos,
  STRING_AGG(nombre_completo || ' — ' || c.nombre, ' | ' ORDER BY fecha_nacimiento) AS detalle
FROM aps
JOIN cursos c ON aps.id_curso = c.id
GROUP BY ap_p, ap_m
HAVING COUNT(*) > 1
ORDER BY hermanos DESC, familia;
 
-- Mellizos (mismo curso, mismos apellidos, misma fecha):
SELECT a1.nombre_completo, a2.nombre_completo,
       c.nombre AS curso, a1.fecha_nacimiento
FROM alumnos a1
JOIN alumnos a2 ON a1.id < a2.id
  AND a1.id_curso = a2.id_curso
  AND a1.fecha_nacimiento = a2.fecha_nacimiento
  AND split_part(a1.nombre_completo,' ', array_length(string_to_array(a1.nombre_completo,' '),1)-1)
    = split_part(a2.nombre_completo,' ', array_length(string_to_array(a2.nombre_completo,' '),1)-1)
JOIN cursos c ON a1.id_curso = c.id;
 
 
-- ================================================================
-- BLOQUE 4: CREAR APODERADOS PARA CADA FAMILIA EN USUARIOS
-- Un apoderado por familia. No se crean los dos padres.
-- ================================================================
 
INSERT INTO usuarios (id, nombre_completo, correo, rol, contraseña, especialidad) VALUES
 
-- 4 hermanos
(gen_random_uuid(),'Carmen Morales Araneda',     'c.morales.ap@edusync.cl',     'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Jorge Herrera Bustos',        'j.herrera.ap@edusync.cl',     'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
 
-- 3 hermanos
(gen_random_uuid(),'Patricia Espinoza Vera',      'p.espinoza.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Roberto Lagos Cáceres',       'r.lagos.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Sandra Castro Díaz',          's.castro.ap@edusync.cl',      'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Marcelo Silva Robles',        'm.silva.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Verónica Araya González',     'v.araya.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Héctor Gutiérrez Salazar',    'h.gutierrez.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
 
-- Mellizos
(gen_random_uuid(),'Cecilia Carvallo Infante',    'c.carvallo.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
 
-- 25 grupos de 2 hermanos
(gen_random_uuid(),'Luis Torres Araneda',         'l.torres.g01.ap@edusync.cl',  'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Gloria Álvarez Bustos',       'g.alvarez.g02.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Carlos Garrido Leiva',        'c.garrido.g03.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Mónica Ibáñez Novoa',         'm.ibanez.g04.ap@edusync.cl',  'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Eduardo Pino Jorquera',       'e.pino.g05.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Rosa Navarro Ortega',         'r.navarro.g06.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Sergio Quiroga Palma',        's.quiroga.g07.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Lorena Reyes Quezada',        'l.reyes.g08.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Pedro Sandoval Aguilera',     'p.sandoval.g09.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Ana Tapia Baeza',             'a.tapia.g10.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Felipe Urrutia Contreras',    'f.urrutia.g11.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Isabel Valenzuela Díaz',      'i.valenzuela.g12.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Gonzalo Vivanco Fuentealba',  'g.vivanco.g13.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Claudia Yáñez Herrera',       'c.yanez.g14.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Marco Acuña Iglesias',        'm.acuna.g15.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Pilar Donoso Jofré',          'p.donoso.g16.ap@edusync.cl',  'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Ricardo Escobar Krause',      'r.escobar.g17.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Natalia Figueroa López',      'n.figueroa.g18.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Osvaldo Guajardo Mansilla',   'o.guajardo.g19.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Beatriz Henríquez Naranjo',   'b.henriquez.g20.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Ismael Illanes Olivares',     'i.illanes.g21.ap@edusync.cl', 'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Teresa Jara Pérez',           't.jara.g22.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Hugo Lagos Quiroz',           'h.lagos.g23.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Eliana Medina Poblete',       'e.medina.g24.ap@edusync.cl',  'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
(gen_random_uuid(),'Andrés Navarrete Sepúlveda',  'a.navarrete.g25.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL);
 
 
-- ================================================================
-- BLOQUE 5: VINCULAR APODERADOS DE FAMILIAS A SUS ALUMNOS
-- ================================================================
 
-- 4 hermanos — Vargas Morales
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='c.morales.ap@edusync.cl')
WHERE id IN (281,301,321,341);
 
-- 4 hermanos — Herrera Andrade
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='j.herrera.ap@edusync.cl')
WHERE id IN (401,421,441,461);
 
-- 3 hermanos — Rojas Espinoza
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='p.espinoza.ap@edusync.cl')
WHERE id IN (302,342,382);
 
-- 3 hermanos — Lagos Fuentes
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='r.lagos.ap@edusync.cl')
WHERE id IN (322,363,402);
 
-- 3 hermanos — Castro Medina
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='s.castro.ap@edusync.cl')
WHERE id IN (343,383,422);
 
-- 3 hermanos — Silva Tapia
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='m.silva.ap@edusync.cl')
WHERE id IN (364,423,462);
 
-- 3 hermanos — Araya Sepúlveda
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='v.araya.ap@edusync.cl')
WHERE id IN (384,442,481);
 
-- 3 hermanos — Gutiérrez Pinto
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='h.gutierrez.ap@edusync.cl')
WHERE id IN (403,463,496);
 
-- Mellizos — Ojeda Carvallo
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='c.carvallo.ap@edusync.cl')
WHERE id IN (361,362);
 
-- 25 grupos de 2 hermanos
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='l.torres.g01.ap@edusync.cl')   WHERE id IN (283,365);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='g.alvarez.g02.ap@edusync.cl')  WHERE id IN (284,385);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='c.garrido.g03.ap@edusync.cl')  WHERE id IN (303,366);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='m.ibanez.g04.ap@edusync.cl')   WHERE id IN (304,386);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='e.pino.g05.ap@edusync.cl')     WHERE id IN (305,404);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='r.navarro.g06.ap@edusync.cl')  WHERE id IN (323,387);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='s.quiroga.g07.ap@edusync.cl')  WHERE id IN (324,405);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='l.reyes.g08.ap@edusync.cl')    WHERE id IN (325,424);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='p.sandoval.g09.ap@edusync.cl') WHERE id IN (344,406);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='a.tapia.g10.ap@edusync.cl')    WHERE id IN (345,425);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='f.urrutia.g11.ap@edusync.cl')  WHERE id IN (346,443);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='i.valenzuela.g12.ap@edusync.cl') WHERE id IN (367,444);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='g.vivanco.g13.ap@edusync.cl')  WHERE id IN (368,464);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='c.yanez.g14.ap@edusync.cl')    WHERE id IN (388,465);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='m.acuna.g15.ap@edusync.cl')    WHERE id IN (389,486);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='p.donoso.g16.ap@edusync.cl')   WHERE id IN (407,483);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='r.escobar.g17.ap@edusync.cl')  WHERE id IN (408,497);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='n.figueroa.g18.ap@edusync.cl') WHERE id IN (426,484);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='o.guajardo.g19.ap@edusync.cl') WHERE id IN (427,498);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='b.henriquez.g20.ap@edusync.cl') WHERE id IN (445,499);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='i.illanes.g21.ap@edusync.cl')  WHERE id IN (446,516);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='t.jara.g22.ap@edusync.cl')     WHERE id IN (466,517);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='h.lagos.g23.ap@edusync.cl')    WHERE id IN (467,536);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='e.medina.g24.ap@edusync.cl')   WHERE id IN (485,518);
UPDATE alumnos SET id_apoderado=(SELECT id FROM usuarios WHERE correo='a.navarrete.g25.ap@edusync.cl') WHERE id IN (500,537);
 
 
-- ================================================================
-- BLOQUE 6: APODERADOS INDIVIDUALES (un apoderado por alumno solo)
-- Genera automáticamente un apoderado por cada alumno sin familia.
-- ================================================================
 
DO $$
DECLARE
  rec      RECORD;
  cnt      INTEGER := 0;
  ap_uuid  UUID;
  nm_ap    TEXT;
  correo   TEXT;
  nombres_m TEXT[] := ARRAY['Jorge','Carlos','Roberto','Pedro','Luis','Manuel',
    'Eduardo','Sergio','Patricio','Rodrigo','Hernán','Claudio','Marcelo','Héctor',
    'Raúl','César','Oscar','Fernando','Gonzalo','Alfredo','Álvaro','Pablo',
    'Miguel','Víctor','Ricardo','Enrique','Camilo','Fabián','Gabriel','Hugo'];
  nombres_f TEXT[] := ARRAY['María','Ana','Carmen','Rosa','Patricia','Claudia',
    'Sandra','Mónica','Verónica','Gloria','Lorena','Cecilia','Beatriz','Marcela',
    'Romina','Natalia','Pilar','Rocío','Ximena','Soledad','Angélica','Belén',
    'Débora','Giselle','Helena','Inés','Karen','Leslie','Nadia','Pamela'];
  ap_p TEXT[] := ARRAY['Araya','Bravo','Campos','Delgado','Espinoza','Farías',
    'Garrido','Ibáñez','Jara','Lagos','Medina','Navarrete','Ojeda','Pizarro',
    'Quiroga','Reyes','Sandoval','Tapia','Urrutia','Valenzuela','Vivanco',
    'Yáñez','Zamora','Acuña','Ceballos','Donoso','Escobar','Figueroa',
    'Guajardo','Henríquez'];
  ap_m TEXT[] := ARRAY['Araneda','Bustos','Cáceres','Elgueta','Fuenzalida','Gómez',
    'Huerta','Infante','Jorquera','Leiva','Mena','Novoa','Ortega','Palma',
    'Quezada','Robles','Salazar','Uribe','Vera','Alvarado','Barriga','Cid',
    'Dávila','Encina','Gaete','Henríquez','Mellado','Núñez','Olguín','Paredes'];
  es_m BOOLEAN;
  i_n  INTEGER;
  i_p  INTEGER;
  i_m  INTEGER;
BEGIN
  FOR rec IN
    SELECT id FROM alumnos WHERE id_apoderado IS NULL ORDER BY id
  LOOP
    cnt  := cnt + 1;
    es_m := (cnt % 3 = 0);   -- ~33% padres, ~67% madres
    i_n  := ((cnt-1) % 30) + 1;
    i_p  := ((cnt-1) % 30) + 1;
    i_m  := ((cnt+9) % 30) + 1;
 
    IF es_m THEN
      nm_ap := nombres_m[i_n] || ' ' || ap_p[i_p] || ' ' || ap_m[i_m];
    ELSE
      nm_ap := nombres_f[i_n] || ' ' || ap_p[i_p] || ' ' || ap_m[i_m];
    END IF;
 
    correo := lower(replace(split_part(nm_ap,' ',1),'á','a')) ||
              lower(replace(split_part(nm_ap,' ',2),'é','e')) ||
              cnt::TEXT || '@edusync.cl';
 
    INSERT INTO usuarios (id, nombre_completo, correo, rol, contraseña, especialidad)
    VALUES (gen_random_uuid(), nm_ap, correo, 'apoderado', crypt('Apoderado2024!',gen_salt('bf',10)), NULL)
    RETURNING id INTO ap_uuid;
 
    UPDATE alumnos SET id_apoderado = ap_uuid WHERE id = rec.id;
 
    INSERT INTO apoderado_alumno (id_apoderado, id_alumno)
    VALUES (ap_uuid, rec.id);
  END LOOP;
  RAISE NOTICE '✅ % apoderados individuales creados y vinculados.', cnt;
END;
$$;
 
-- Sincronizar apoderado_alumno para los grupos de familia:
INSERT INTO apoderado_alumno (id_apoderado, id_alumno)
SELECT a.id_apoderado, a.id
FROM alumnos a
WHERE a.id_apoderado IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM apoderado_alumno r
    WHERE r.id_apoderado = a.id_apoderado AND r.id_alumno = a.id
  );
 
 
-- ================================================================
-- BLOQUE 7: VERIFICACIÓN FINAL
-- ================================================================
 
-- Familias con más de 1 hijo (hermanos):
SELECT
  u.nombre_completo            AS apoderado,
  COUNT(a.id)                  AS hijos,
  STRING_AGG(a.nombre_completo || ' (' || c.nombre || ')',
             ' | ' ORDER BY a.fecha_nacimiento) AS alumnos
FROM usuarios u
JOIN alumnos a  ON a.id_apoderado = u.id
JOIN cursos  c  ON a.id_curso = c.id
WHERE u.rol = 'apoderado'
GROUP BY u.id, u.nombre_completo
HAVING COUNT(a.id) > 1
ORDER BY hijos DESC, u.nombre_completo;
 
-- Conteo resumen:
SELECT
  COUNT(*) FILTER (WHERE rol='apoderado') AS total_apoderados,
  COUNT(*) FILTER (WHERE rol='profesor')  AS total_profesores,
  COUNT(*) FILTER (WHERE rol='director')  AS total_directores
FROM usuarios;
 
-- Alumnos sin apoderado (debe ser 0):
SELECT COUNT(*) AS sin_apoderado FROM alumnos WHERE id_apoderado IS NULL;
 
-- Mellizos detectados:
SELECT a1.nombre_completo, a2.nombre_completo, c.nombre AS curso, a1.fecha_nacimiento
FROM alumnos a1
JOIN alumnos a2 ON a1.id < a2.id
  AND a1.id_curso = a2.id_curso
  AND a1.fecha_nacimiento = a2.fecha_nacimiento
  AND split_part(a1.nombre_completo,' ',array_length(string_to_array(a1.nombre_completo,' '),1)-1)
    = split_part(a2.nombre_completo,' ',array_length(string_to_array(a2.nombre_completo,' '),1)-1)
JOIN cursos c ON a1.id_curso = c.id;
