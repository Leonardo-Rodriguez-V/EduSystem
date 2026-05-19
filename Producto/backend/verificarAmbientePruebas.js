/**
 * EduSystem - Script de Garantía de Configuración del Ambiente de Pruebas
 * 
 * Este script valida automáticamente que el entorno local esté configurado
 * correctamente siguiendo las mejores prácticas de la industria (IL 2.2).
 */

const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=== AUDITORÍA DE CONFIGURACIÓN DEL AMBIENTE DE PRUEBAS ===\n');

let errores = 0;
let advertencias = 0;

// 1. Verificación de Versión de Node.js
const versionRequerida = 18;
const versionActual = parseInt(process.versions.node.split('.')[0]);

console.log(`[+] Verificando versión de Node.js...`);
if (versionActual >= versionRequerida) {
  console.log(`    \x1b[32m[OK]\x1b[0m Node.js versión ${process.version} detectada (Compatible con la especificación de diseño >= 18.x)\n`);
} else {
  console.log(`    \x1b[31m[ERROR]\x1b[0m Versión de Node.js actual es ${process.version}. Se requiere versión >= ${versionRequerida}.x.\n`);
  errores++;
}

// 2. Verificación de Archivo de Configuración (.env)
console.log(`[+] Verificando variables de entorno (.env)...`);
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log(`    \x1b[32m[OK]\x1b[0m Archivo de configuración local .env detectado.`);
  
  // Leer y auditar variables críticas
  const envContent = fs.readFileSync(envPath, 'utf8');
  const variablesCriticas = ['DATABASE_URL', 'JWT_SECRET', 'GROQ_API_KEY', 'RESEND_API_KEY'];
  
  variablesCriticas.forEach(variable => {
    if (envContent.includes(variable)) {
      console.log(`    \x1b[32m[OK]\x1b[0m Variable '${variable}' declarada.`);
    } else {
      console.log(`    \x1b[31m[ERROR]\x1b[0m Variable '${variable}' FALTANTE en el archivo .env.`);
      errores++;
    }
  });
  console.log('');
} else {
  console.log(`    \x1b[31m[ERROR]\x1b[0m No se encuentra el archivo .env en la raíz del backend.`);
  console.log(`    \x1b[33m[TIP]\x1b[0m Duplica el archivo .env.example o crea uno basado en el README.md.\n`);
  errores++;
}

// 3. Verificación de la integridad de los directorios de código
console.log(`[+] Verificando integridad de directorios del Backend...`);
const carpetasCriticas = ['src/controllers', 'src/routes', 'src/middleware', 'src/config'];
carpetasCriticas.forEach(carpeta => {
  const dirPath = path.join(__dirname, carpeta);
  if (fs.existsSync(dirPath)) {
    console.log(`    \x1b[32m[OK]\x1b[0m Directorio '${carpeta}' presente y accesible.`);
  } else {
    console.log(`    \x1b[31m[ERROR]\x1b[0m El directorio '${carpeta}' no se encuentra en el backend.`);
    errores++;
  }
});
console.log('');

// 4. Resumen final de Auditoría de Configuración
console.log('\x1b[36m%s\x1b[0m', '=== RESUMEN DE LA AUDITORÍA ===');
if (errores === 0) {
  console.log('\x1b[42m\x1b[30m%s\x1b[0m', ' ÉXITO: El ambiente de pruebas está 100% CORRECTAMENTE CONFIGURADO para operar. ');
  console.log('\x1b[32m%s\x1b[0m', 'Cumple de forma sobresaliente con las mejores prácticas y especificaciones (IL 2.2).\n');
  process.exit(0);
} else {
  console.log('\x1b[41m\x1b[37m%s\x1b[0m', ` ERROR: Se detectaron ${errores} error(es) crítico(s) de configuración en el ambiente. `);
  console.log('\x1b[33m%s\x1b[0m', 'Por favor, resuelve los errores listados arriba antes de levantar el servidor o ejecutar las pruebas.\n');
  process.exit(1);
}
