const fs = require('fs');
const path = require('path');

const RUTA_PROYECTO = './src/app';

function procesarArchivo(filePath) {
  if (!filePath.endsWith('.ts')) return;

  let contenido = fs.readFileSync(filePath, 'utf8');

  // Busca strings mal reemplazados con comillas simples o dobles
  const regexRoto = /(['"])\$\{environment\.apiUrl\}\/([^'"]+)\1/g;

  if (!regexRoto.test(contenido)) return;

  console.log(`🧹 Arreglando cagada en: ${filePath}`);

  // Reemplaza por backticks correctamente
  contenido = contenido.replace(regexRoto, (_, __, ruta) => {
    return `\`${'${environment.apiUrl}'}/${ruta}\``;
  });

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

recorrerDirectorio(RUTA_PROYECTO);
console.log('Arreglo de reemplazos rotos finalizado.');
