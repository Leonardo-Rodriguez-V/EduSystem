require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function applyMaestro() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando Migración MAESTRO...');

    // 0. Asegurar extensiones
    console.log('--- Bloque 0: Asegurar pgcrypto ---');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    console.log('✅ Extensión pgcrypto lista.');

    const sqlPath = path.join(__dirname, 'maestro_migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Separar por comentarios de bloque para ejecución ordenada
    // Aunque es mejor definir los bloques aquí para mayor control
    
    // BLOQUE 1: Renombrar Alumnos (DO block)
    console.log('\n--- Bloque 1: Renombrando alumnos con nombres únicos ---');
    await client.query(`
      DO $$
      DECLARE
        rec      RECORD;
        cnt      INTEGER := 0;
        año_nac  INTEGER;
        mes_nac  INTEGER;
        dia_nac  INTEGER;
        nm TEXT[] := ARRAY['Diego','Sebastián','Felipe','Ignacio','Cristóbal','Benjamín','Emilio','Claudio','Javier','Pablo','Marco','Luciano','Agustín','Bastián','Esteban','Mauricio','Sergio','Carlos','Víctor','Luis','Roberto','Miguel','Hernán','Eduardo','Fernando','Gonzalo','Marcelo','Héctor','Raúl','César','Oscar','Manuel','Alfredo','Álvaro','Bruno','Camilo','Daniel','Enrique','Fabián','Gabriel','Hugo','Ismael','Jaime','Kevin','Leonardo','Maximiliano','Nicolás','Orlando','Patricio','Rubén'];
        nf TEXT[] := ARRAY['Sofía','Emilia','Isabella','Antonia','Francisca','Fernanda','Renata','Daniela','Bárbara','Alejandra','Cecilia','Beatriz','Lorena','Marcela','Romina','Natalia','Pilar','Rocío','Ximena','Catalina','Trinidad','Florencia','Pía','Carla','Verónica','Patricia','Claudia','Sandra','Mónica','Gloria','Carmen','Rosa','Elena','Jacqueline','Soledad','Angélica','Belén','Débora','Esperanza','Giselle','Helena','Inés','Jessica','Karen','Leslie','Macarena','Nadia','Olga','Pamela','Tamara'];
        app TEXT[] := ARRAY['Araya','Bravo','Campos','Delgado','Espinoza','Farías','Garrido','Ibáñez','Jara','Lagos','Medina','Navarrete','Ojeda','Pizarro','Quiroga','Reyes','Sandoval','Tapia','Urrutia','Valenzuela','Vivanco','Yáñez','Zamora','Acuña','Ceballos','Donoso','Escobar','Figueroa','Guajardo','Henríquez','Illanes','Letelier','Merino','Opazo','Palomino','Riquelme','Salas','Toro','Uribe','Vera','Aravena','Barría','Cáceres','Durán','Fuenzalida','Grandón','Huerta','Insunza','Jorquera','Lira','Mansilla','Naranjo','Ortiz','Peña','Quiñones','Robles','Saavedra','Troncoso'];
        apm TEXT[] := ARRAY['Araneda','Bustos','Cáceres','Elgueta','Fuenzalida','Gómez','Huerta','Infante','Jorquera','Leiva','Mena','Novoa','Ortega','Palma','Quezada','Robles','Salazar','Uribe','Vera','Alvarado','Barriga','Cid','Dávila','Encina','Gaete','Henríquez','Irarrázaval','Kehr','Mellado','Núñez','Olguín','Paredes','Ríos','Sepúlveda','Toro','Varas','Westermeyer','Yunge','Zúñiga','Aguilera','Baeza','Contreras','Díaz','Fuentealba','González','Herrera','Iglesias','Jofré','Krause','López','Mansilla','Naranjo','Olivares','Pérez','Quiroz','Poblete'];
        i_n INTEGER; i_pp INTEGER; i_pm INTEGER; nom TEXT;
      BEGIN
        FOR rec IN SELECT a.id, c.nombre AS cnombre FROM alumnos a JOIN cursos c ON a.id_curso = c.id WHERE a.id NOT IN (1,2,3,4) ORDER BY c.id, a.id
        LOOP
          cnt := cnt + 1;
          i_n := ((cnt - 1) % 50) + 1;
          i_pp := ((cnt - 1) % 58) + 1;
          i_pm := ((cnt + 17) % 55) + 1;
          IF cnt % 2 = 1 THEN nom := nm[i_n] || ' ' || app[i_pp] || ' ' || apm[i_pm];
          ELSE nom := nf[i_n] || ' ' || app[i_pp] || ' ' || apm[i_pm]; END IF;
          año_nac := CASE rec.cnombre
            WHEN 'Pre-Kínder (NT1)' THEN 2021 WHEN 'Kínder (NT2)' THEN 2020 WHEN '1° Básico' THEN 2019 WHEN '2° Básico' THEN 2018 WHEN '3° Básico' THEN 2017 WHEN '4° Básico' THEN 2016 WHEN '5° Básico' THEN 2015 WHEN '6° Básico' THEN 2014 WHEN '7° Básico' THEN 2013 WHEN '8° Básico' THEN 2012 WHEN '1° Medio' THEN 2011 WHEN '2° Medio' THEN 2010 WHEN '3° Medio' THEN 2009 WHEN '4° Medio' THEN 2008 ELSE 2015 END;
          mes_nac := (cnt % 12) + 1; dia_nac := (cnt % 28) + 1;
          UPDATE alumnos SET nombre_completo = nom, fecha_nacimiento = make_date(año_nac, mes_nac, dia_nac) WHERE id = rec.id;
        END LOOP;
      END;
      $$;
    `);
    console.log('✅ Alumnos renombrados.');

    // BLOQUE 2: Grupos de Hermanos (Updates manuales)
    console.log('\n--- Bloque 2: Creando grupos de hermanos ---');
    const updatesHermanos = [
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Vargas Morales' WHERE id IN (281, 301, 321, 341)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Herrera Andrade' WHERE id IN (401, 421, 441, 461)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Rojas Espinoza' WHERE id IN (302, 342, 382)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Lagos Fuentes' WHERE id IN (322, 363, 402)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Castro Medina' WHERE id IN (343, 383, 422)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Silva Tapia' WHERE id IN (364, 423, 462)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Araya Sepúlveda' WHERE id IN (384, 442, 481)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Gutiérrez Pinto' WHERE id IN (403, 463, 496)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Ojeda Carvallo', fecha_nacimiento = '2017-08-12' WHERE id IN (361, 362)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Muñoz Torres' WHERE id IN (283, 365)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Díaz Álvarez' WHERE id IN (284, 385)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Pérez Garrido' WHERE id IN (303, 366)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' González Ibáñez' WHERE id IN (304, 386)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Martínez Pino' WHERE id IN (305, 404)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Rodríguez Navarro' WHERE id IN (323, 387)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Fernández Quiroga' WHERE id IN (324, 405)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Torres Reyes' WHERE id IN (325, 424)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Soto Sandoval' WHERE id IN (344, 406)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Flores Tapia' WHERE id IN (345, 425)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Morales Urrutia' WHERE id IN (346, 443)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Contreras Valenzuela' WHERE id IN (367, 444)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Ramírez Vivanco' WHERE id IN (368, 464)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Miranda Yáñez' WHERE id IN (388, 465)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Jiménez Acuña' WHERE id IN (389, 486)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Álvarez Donoso' WHERE id IN (407, 483)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Sepúlveda Escobar' WHERE id IN (408, 497)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Núñez Figueroa' WHERE id IN (426, 484)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Pizarro Guajardo' WHERE id IN (427, 498)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Vera Henríquez' WHERE id IN (445, 499)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Bravo Illanes' WHERE id IN (446, 516)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Campos Jara' WHERE id IN (466, 517)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Delgado Lagos' WHERE id IN (467, 536)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Espinoza Medina' WHERE id IN (485, 518)",
      "UPDATE alumnos SET nombre_completo = split_part(nombre_completo,' ',1) || ' Farías Navarrete' WHERE id IN (500, 537)"
    ];
    for (const sql of updatesHermanos) {
       await client.query(sql);
    }
    console.log('✅ Grupos de hermanos actualizados.');

    // BLOQUE 4: Insertar Apoderados de familia
    console.log('\n--- Bloque 4: Creando apoderados para familias ---');
    await client.query(`
      INSERT INTO usuarios (id, nombre_completo, correo, rol, contraseña, especialidad) VALUES
      (gen_random_uuid(),'Carmen Morales Araneda',     'c.morales.ap@edusync.cl',     'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Jorge Herrera Bustos',        'j.herrera.ap@edusync.cl',     'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Patricia Espinoza Vera',      'p.espinoza.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Roberto Lagos Cáceres',       'r.lagos.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Sandra Castro Díaz',          's.castro.ap@edusync.cl',      'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Marcelo Silva Robles',        'm.silva.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Verónica Araya González',     'v.araya.ap@edusync.cl',       'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Héctor Gutiérrez Salazar',    'h.gutierrez.ap@edusync.cl',   'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
      (gen_random_uuid(),'Cecilia Carvallo Infante',    'c.carvallo.ap@edusync.cl',    'apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL),
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
      (gen_random_uuid(),'Andrés Navarrete Sepúlveda',  'a.navarrete.g25.ap@edusync.cl','apoderado',crypt('Apoderado2024!',gen_salt('bf',10)),NULL)
      ON CONFLICT (correo) DO NOTHING
    `);
    console.log('✅ Apoderados de familias insertados.');

    // BLOQUE 5: Vincular Apoderados
    console.log('\n--- Bloque 5: Vinculando alumnos a sus apoderados ---');
    const linksAps = [
      ["c.morales.ap@edusync.cl", [281,301,321,341]],
      ["j.herrera.ap@edusync.cl", [401,421,441,461]],
      ["p.espinoza.ap@edusync.cl", [302,342,382]],
      ["r.lagos.ap@edusync.cl", [322,363,402]],
      ["s.castro.ap@edusync.cl", [343,383,422]],
      ["m.silva.ap@edusync.cl", [364,423,462]],
      ["v.araya.ap@edusync.cl", [384,442,481]],
      ["h.gutierrez.ap@edusync.cl", [403,463,496]],
      ["c.carvallo.ap@edusync.cl", [361,362]],
      ["l.torres.g01.ap@edusync.cl", [283,365]],
      ["g.alvarez.g02.ap@edusync.cl", [284,385]],
      ["c.garrido.g03.ap@edusync.cl", [303,366]],
      ["m.ibanez.g04.ap@edusync.cl", [304,386]],
      ["e.pino.g05.ap@edusync.cl", [305,404]],
      ["r.navarro.g06.ap@edusync.cl", [323,387]],
      ["s.quiroga.g07.ap@edusync.cl", [324,405]],
      ["l.reyes.g08.ap@edusync.cl", [325,424]],
      ["p.sandoval.g09.ap@edusync.cl", [344,406]],
      ["a.tapia.g10.ap@edusync.cl", [345,425]],
      ["f.urrutia.g11.ap@edusync.cl", [346,443]],
      ["i.valenzuela.g12.ap@edusync.cl", [367,444]],
      ["g.vivanco.g13.ap@edusync.cl", [368,464]],
      ["c.yanez.g14.ap@edusync.cl", [388,465]],
      ["m.acuna.g15.ap@edusync.cl", [389,486]],
      ["p.donoso.g16.ap@edusync.cl", [407,483]],
      ["r.escobar.g17.ap@edusync.cl", [408,497]],
      ["n.figueroa.g18.ap@edusync.cl", [426,484]],
      ["o.guajardo.g19.ap@edusync.cl", [427,498]],
      ["b.henriquez.g20.ap@edusync.cl", [445,499]],
      ["i.illanes.g21.ap@edusync.cl", [446,516]],
      ["t.jara.g22.ap@edusync.cl", [466,517]], // Nota: el script original decía (466,517)
      ["h.lagos.g23.ap@edusync.cl", [467,536]],
      ["e.medina.g24.ap@edusync.cl", [485,518]],
      ["a.navarrete.g25.ap@edusync.cl", [500,537]]
    ];
    for (const [correo, ids] of linksAps) {
       await client.query(`UPDATE alumnos SET id_apoderado = (SELECT id FROM usuarios WHERE correo = $1) WHERE id = ANY($2::int[])`, [correo, ids]);
    }
    console.log('✅ Alumnos vinculados a familias.');

    // BLOQUE 6: Apoderados Individuales (DO block)
    console.log('\n--- Bloque 6: Creando apoderados individuales para el resto ---');
    await client.query(`
      DO $$
      DECLARE
        rec      RECORD;
        cnt      INTEGER := 0;
        ap_uuid  UUID;
        nm_ap    TEXT;
        correo   TEXT;
        nombres_m TEXT[] := ARRAY['Jorge','Carlos','Roberto','Pedro','Luis','Manuel','Eduardo','Sergio','Patricio','Rodrigo','Hernán','Claudio','Marcelo','Héctor','Raúl','César','Oscar','Fernando','Gonzalo','Alfredo','Álvaro','Pablo','Miguel','Víctor','Ricardo','Enrique','Camilo','Fabián','Gabriel','Hugo'];
        nombres_f TEXT[] := ARRAY['María','Ana','Carmen','Rosa','Patricia','Claudia','Sandra','Mónica','Verónica','Gloria','Lorena','Cecilia','Beatriz','Marcela','Romina','Natalia','Pilar','Rocío','Ximena','Soledad','Angélica','Belén','Débora','Giselle','Helena','Inés','Karen','Leslie','Nadia','Pamela'];
        ap_p TEXT[] := ARRAY['Araya','Bravo','Campos','Delgado','Espinoza','Farías','Garrido','Ibáñez','Jara','Lagos','Medina','Navarrete','Ojeda','Pizarro','Quiroga','Reyes','Sandoval','Tapia','Urrutia','Valenzuela','Vivanco','Yáñez','Zamora','Acuña','Ceballos','Donoso','Escobar','Figueroa','Guajardo','Henríquez'];
        ap_m TEXT[] := ARRAY['Araneda','Bustos','Cáceres','Elgueta','Fuenzalida','Gómez','Huerta','Infante','Jorquera','Leiva','Mena','Novoa','Ortega','Palma','Quezada','Robles','Salazar','Uribe','Vera','Alvarado','Barriga','Cid','Dávila','Encina','Gaete','Henríquez','Mellado','Núñez','Olguín','Paredes'];
        es_m BOOLEAN; i_n INTEGER; i_p INTEGER; i_m INTEGER;
      BEGIN
        FOR rec IN SELECT id FROM alumnos WHERE id_apoderado IS NULL ORDER BY id
        LOOP
          cnt := cnt + 1;
          es_m := (cnt % 3 = 0);
          i_n := ((cnt-1) % 30) + 1; i_p := ((cnt-1) % 30) + 1; i_m := ((cnt+9) % 30) + 1;
          IF es_m THEN nm_ap := nombres_m[i_n] || ' ' || ap_p[i_p] || ' ' || ap_m[i_m];
          ELSE nm_ap := nombres_f[i_n] || ' ' || ap_p[i_p] || ' ' || ap_m[i_m]; END IF;
          correo := lower(replace(split_part(nm_ap,' ',1),'á','a')) || lower(replace(split_part(nm_ap,' ',2),'é','e')) || cnt::TEXT || '@edusync.cl';
          INSERT INTO usuarios (id, nombre_completo, correo, rol, contraseña)
          VALUES (gen_random_uuid(), nm_ap, correo, 'apoderado', crypt('Apoderado2024!',gen_salt('bf',10)))
          RETURNING id INTO ap_uuid;
          UPDATE alumnos SET id_apoderado = ap_uuid WHERE id = rec.id;
        END LOOP;
      END;
      $$;
    `);
    
    // Sincronizar apoderado_alumno
    console.log('--- Sincronizando tabla apoderado_alumno ---');
    await client.query(`
      INSERT INTO apoderado_alumno (id_apoderado, id_alumno)
      SELECT a.id_apoderado, a.id
      FROM alumnos a
      WHERE a.id_apoderado IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM apoderado_alumno r
          WHERE r.id_apoderado = a.id_apoderado AND r.id_alumno = a.id
        );
    `);
    console.log('✅ Apoderados individuales creados y sincronizados.');

    // BLOQUE 7: Verificación
    console.log('\n--- Bloque 7: Verificación final ---');
    const resResumen = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE rol='apoderado') AS apoderados,
        COUNT(*) FILTER (WHERE rol='profesor')  AS profesores
      FROM usuarios
    `);
    const resSinAp = await client.query(`SELECT COUNT(*) AS sin_ap FROM alumnos WHERE id_apoderado IS NULL`);
    const resFamilias = await client.query(`
       SELECT COUNT(DISTINCT id_apoderado) as familias_con_multiples_hijos
       FROM alumnos
       GROUP BY id_apoderado
       HAVING COUNT(*) > 1
    `);

    console.log(`📊 Total Apoderados: ${resResumen.rows[0].apoderados}`);
    console.log(`📊 Total Profesores: ${resResumen.rows[0].profesores}`);
    console.log(`📊 Alumnos sin Apoderado (debe ser 0): ${resSinAp.rows[0].sin_ap}`);
    console.log(`📊 Grupos de familias (hermanos): ${resFamilias.rowCount}`);

    console.log('\n🎉 MIGRACIÓN MAESTRO COMPLETADA CON ÉXITO.');

  } catch (err) {
    console.error('❌ ERROR durante la migración:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

applyMaestro();
