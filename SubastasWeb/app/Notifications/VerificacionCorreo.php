<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class VerificacionCorreo extends VerifyEmail
{
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Verificá tu correo en Subasta Web')
            ->greeting('¡Bienvenido a Subasta Web!')
            ->line('Gracias por registrarte. Para activar tu cuenta, hacé clic en el botón a continuación.')
            ->action('Verificar mi correo', $this->verificationUrl($notifiable))
            ->line('Si no creaste esta cuenta, podés ignorar este mensaje.')
            ->salutation('¡Nos vemos pronto en las subastas!');
    }

    protected function verificationUrl($notifiable)
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );
    }
}
