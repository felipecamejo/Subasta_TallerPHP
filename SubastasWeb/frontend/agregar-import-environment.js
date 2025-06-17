const fs = require('fs');
const path = require('path');

const RUTA_BASE = './src/app';
const ENV_PATH_ABS = path.resolve('./src/environments/environment.ts');

function calcularRutaRelativa(desdeArchivo) {
  const desde = path.dirname(desdeArchivo);
  const rutaRelativa = path.relative(desde, ENV_PATH_ABS);
  return rutaRelativa.replace(/\\/g, '/').replace(/\.ts$/, '');
}

function yaTieneImport(contenido) {
  const regex = /import\s+{[^}]*environment[^}]*}\s+from\s+['"].*environments\/environment['"]/;
  return regex.test(contenido);
}

function usaEnvironment(contenido) {
  const regexUso = /\benvironment\b/;
  return regexUso.test(contenido);
}

function procesarArchivo(filePath) {
  if (!filePath.endsWith('.ts')) return;

  let contenido = fs.readFileSync(filePath, 'utf8');

  if (!usaEnvironment(contenido)) return;
  if (yaTieneImport(contenido)) return;

  const rutaImport = calcularRutaRelativa(filePath);
  const importLinea = `import { environment } from '${rutaImport}';\n`;

  console.log(` Agregando import en: ${filePath}`);
  contenido = importLinea + contenido;
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

recorrerDirectorio(RUTA_BASE);
console.log('Todos los imports de environment revisados y corregidos si era necesario.');
