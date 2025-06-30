<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\NotificacionCorreo;
use Exception;

class TestEmail extends Command
{
    protected $signature = 'email:test {email? : Email destino para la prueba}';
    protected $description = 'Probar configuración de email enviando un email de prueba';

    public function handle()
    {
        $this->info('🧪 Iniciando prueba de configuración de email...');
        
        // Verificar configuración
        $this->info('📋 Configuración actual:');
        $this->table(
            ['Variable', 'Valor'],
            [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_HOST', config('mail.mailers.smtp.host')],
                ['MAIL_PORT', config('mail.mailers.smtp.port')],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption')],
            ]
        );

        $email = $this->argument('email') ?? 'test@example.com';
        
        $this->info("📧 Enviando email de prueba a: {$email}");
        
        try {
            Mail::raw(
                "¡Hola! 👋\n\n" .
                "Este es un email de prueba del Sistema de Subastas.\n\n" .
                "Si recibiste este mensaje, significa que:\n" .
                "✅ La configuración SMTP está correcta\n" .
                "✅ Las credenciales de Gmail funcionan\n" .
                "✅ El sistema puede enviar emails\n\n" .
                "Configuración utilizada:\n" .
                "- Host: " . config('mail.mailers.smtp.host') . "\n" .
                "- Puerto: " . config('mail.mailers.smtp.port') . "\n" .
                "- Encriptación: " . config('mail.mailers.smtp.encryption') . "\n\n" .
                "¡Todo listo para las subastas! 🎯\n\n" .
                "---\n" .
                "Sistema de Subastas Web\n" .
                "Enviado desde Docker en " . now()->format('Y-m-d H:i:s'),
                function ($message) use ($email) {
                    $message->to($email)
                           ->subject('✅ Prueba de Email - Sistema de Subastas')
                           ->from(
                               config('mail.from.address'),
                               config('mail.from.name')
                           );
                }
            );
            
            $this->info('✅ Email enviado exitosamente!');
            $this->info('📬 Revisa la bandeja de entrada (y spam) de: ' . $email);
            
            // Verificar colas si están habilitadas
            if (config('queue.default') !== 'sync') {
                $this->info('🔄 Email procesado en cola: ' . config('queue.default'));
                $this->info('💡 Ejecuta "php artisan queue:work" si los emails no llegan');
            }
            
            return 0;
            
        } catch (Exception $e) {
            $this->error('❌ Error al enviar email:');
            $this->error($e->getMessage());
            
            $this->warn('🔧 Verificaciones sugeridas:');
            $this->line('• Comprobar credenciales de Gmail');
            $this->line('• Verificar conectividad a smtp.gmail.com:587');
            $this->line('• Revisar logs: tail -f storage/logs/laravel.log');
            $this->line('• Verificar variables de entorno');
            
            return 1;
        }
    }
}
