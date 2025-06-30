# Script PowerShell para probar email en Docker desde Windows
# Ejecutar desde la raíz del proyecto: .\test-email.ps1

Write-Host "🔧 Probando configuración de email en Docker..." -ForegroundColor Cyan

# Verificar que Docker esté funcionando
try {
    $dockerStatus = docker ps --format "table {{.Names}}" | Select-String "laravel_app"
    if (-not $dockerStatus) {
        Write-Host "❌ Error: El contenedor laravel_app no está corriendo." -ForegroundColor Red
        Write-Host "💡 Ejecuta: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Contenedor Laravel detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al verificar Docker. ¿Está Docker Desktop ejecutándose?" -ForegroundColor Red
    exit 1
}

# Verificar configuración de email
Write-Host "`n📧 Verificando configuración de email..." -ForegroundColor Cyan
$emailConfig = docker exec laravel_app php -r "
echo 'MAIL_MAILER: ' . env('MAIL_MAILER') . PHP_EOL;
echo 'MAIL_HOST: ' . env('MAIL_HOST') . PHP_EOL;
echo 'MAIL_PORT: ' . env('MAIL_PORT') . PHP_EOL;
echo 'MAIL_USERNAME: ' . env('MAIL_USERNAME') . PHP_EOL;
echo 'MAIL_FROM_ADDRESS: ' . env('MAIL_FROM_ADDRESS') . PHP_EOL;
echo 'MAIL_ENCRYPTION: ' . env('MAIL_ENCRYPTION') . PHP_EOL;
"
Write-Host $emailConfig -ForegroundColor White

# Probar envío de email
Write-Host "`n📬 Probando envío de email de prueba..." -ForegroundColor Cyan
Write-Host "   (Enviando email de prueba)" -ForegroundColor Gray

$testResult = docker exec laravel_app php artisan tinker --execute="
try {
    \Illuminate\Support\Facades\Mail::raw('Email de prueba desde Docker en Windows. Si recibes este mensaje, la configuración está funcionando correctamente.', function(\$message) {
        \$message->to('test@example.com')
                ->subject('✅ Prueba Email - Sistema Subastas Docker')
                ->from(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
    });
    echo '✅ Email enviado exitosamente desde Docker';
} catch (Exception \$e) {
    echo '❌ Error: ' . \$e->getMessage();
}
"
Write-Host $testResult -ForegroundColor White

# Verificar colas
Write-Host "`n🔄 Verificando estado de las colas..." -ForegroundColor Cyan
$queueStatus = docker exec laravel_app php artisan queue:size
Write-Host "Trabajos en cola: $queueStatus" -ForegroundColor White

# Instrucciones adicionales
Write-Host "`n🎯 Para probar con usuarios reales:" -ForegroundColor Yellow
Write-Host "   1. Ve a http://localhost:8080" -ForegroundColor White
Write-Host "   2. Regístrate con un email real" -ForegroundColor White
Write-Host "   3. Revisa tu bandeja de entrada" -ForegroundColor White
Write-Host "   4. Verifica el email haciendo clic en el enlace" -ForegroundColor White

Write-Host "`n📊 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   docker-compose logs app           # Ver logs" -ForegroundColor White
Write-Host "   docker-compose restart            # Reiniciar servicios" -ForegroundColor White
Write-Host "   docker exec laravel_app php artisan queue:work --once  # Procesar cola" -ForegroundColor White

Write-Host "`n✅ Prueba de email completada!" -ForegroundColor Green
