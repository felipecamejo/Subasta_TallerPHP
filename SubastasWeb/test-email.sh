#!/bin/bash

# Script para probar la configuración de email en Docker
# Ejecutar desde la raíz del proyecto

echo "🧪 Probando configuración de email..."

# Verificar que los contenedores estén corriendo
if ! docker ps | grep -q "laravel_app"; then
    echo "❌ El contenedor laravel_app no está corriendo"
    echo "💡 Ejecuta: docker-compose up -d"
    exit 1
fi

echo "📋 Configuración actual de email:"
docker exec laravel_app php -r "
echo 'MAIL_MAILER: ' . env('MAIL_MAILER') . PHP_EOL;
echo 'MAIL_HOST: ' . env('MAIL_HOST') . PHP_EOL;
echo 'MAIL_PORT: ' . env('MAIL_PORT') . PHP_EOL;
echo 'MAIL_USERNAME: ' . env('MAIL_USERNAME') . PHP_EOL;
echo 'MAIL_FROM_ADDRESS: ' . env('MAIL_FROM_ADDRESS') . PHP_EOL;
echo 'MAIL_ENCRYPTION: ' . env('MAIL_ENCRYPTION') . PHP_EOL;
"

echo ""
echo "🔍 Probando conexión SMTP..."
docker exec laravel_app php artisan tinker --execute="
try {
    \Mail::raw('Email de prueba desde Docker', function(\$message) {
        \$message->to('test@example.com')
                ->subject('Prueba de configuración de email');
    });
    echo '✅ Configuración de email exitosa' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ Error en configuración de email: ' . \$e->getMessage() . PHP_EOL;
}
"

echo ""
echo "📧 Para probar el envío real de emails:"
echo "1. Regístrate como nuevo usuario en la aplicación"
echo "2. Verifica que llegue el email de confirmación"
echo "3. Revisa los logs: docker-compose logs app"
