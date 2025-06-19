// reemplazar-localhost.js
const fs = require('fs');
const path = require('path');

const PROYECTO_PATH = './src/app'; 
const URL_A_REEMPLAZAR = 'http://localhost:8000';
const IMPORT_ENV = `import { environment } from 'src/environments/environment';`;

function procesarArchivo(filePath) {
  const ext = path.extname(filePath);
  if (ext !== '.ts') return;

  let contenido = fs.readFileSync(filePath, 'utf8');

  if (!contenido.includes(URL_A_REEMPLAZAR)) return;

  console.log(`Modificando: ${filePath}`);

  // Reemplazar URLs hardcodeadas
  const regexUrl = new RegExp(URL_A_REEMPLAZAR, 'g');
  contenido = contenido.replace(regexUrl, '${environment.apiUrl}');

  // Asegurar que esté el import
  if (!contenido.includes('environment')) {
    contenido = IMPORT_ENV + '\n' + contenido;
  }

  // Guardar el archivo
  fs.writeFileSync(filePath, contenido, 'utf8');
}

function recorrerDirectorio(dir) {
  const archivos = fs.readdirSync(dir);
  for (const archivo of archivos) {
    const fullPath = path.join(dir, archivo);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      recorrerDirectorio(fullPath);
    } else {
      procesarArchivo(fullPath);
    }
  }
}

// Ejecutar
recorrerDirectorio(PROYECTO_PATH);
console.log('Reemplazo completado.');
