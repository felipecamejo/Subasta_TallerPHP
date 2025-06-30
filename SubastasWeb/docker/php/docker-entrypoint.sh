#!/bin/bash

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is up - executing command"

# Instalar dependencias de Composer
if [ ! -d "vendor" ]; then
    echo "Instalando dependencias de Composer..."
    composer install --no-dev --optimize-autoloader
fi

# Generar clave de aplicación si no existe
if [ ! -f ".env" ]; then
    echo "Copiando .env.example a .env..."
    cp .env.example .env
fi

# Verificar si APP_KEY está vacía
if grep -q "^APP_KEY=$" .env; then
    echo "Generando clave de aplicación..."
    php artisan key:generate
fi

# Configurar permisos de storage y bootstrap/cache
echo "Configurando permisos..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Ejecutar migraciones
echo "Ejecutando migraciones..."
php artisan migrate --force

# Ejecutar seeders solo si es la primera vez o si se fuerza
SEEDER_FLAG_FILE="/var/www/storage/.seeders_executed"
if [ "$RUN_SEEDERS" = "true" ] && [ ! -f "$SEEDER_FLAG_FILE" ]; then
    echo "Ejecutando seeders (primera ejecución)..."
    if [ -n "$SEEDER_CLASS" ]; then
        php artisan db:seed --class="$SEEDER_CLASS" --force
    else
        php artisan db:seed --force
    fi
    # Crear archivo de bandera para indicar que los seeders ya se ejecutaron
    touch "$SEEDER_FLAG_FILE"
    echo "Seeders ejecutados correctamente."
elif [ "$RUN_SEEDERS" = "true" ] && [ -f "$SEEDER_FLAG_FILE" ]; then
    echo "Seeders ya fueron ejecutados anteriormente. Saltando..."
elif [ "$FORCE_SEEDERS" = "true" ]; then
    echo "Ejecutando seeders (forzado)..."
    if [ -n "$SEEDER_CLASS" ]; then
        php artisan db:seed --class="$SEEDER_CLASS" --force
    else
        php artisan db:seed --force
    fi
    echo "Seeders ejecutados (forzado)."
fi

# Cachear configuración y rutas para producción
echo "Optimizando Laravel..."
php artisan config:cache
php artisan route:cache

echo "Iniciando PHP-FPM..."
exec "$@"
