<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMailtrap extends Command
{
    protected $signature = 'test:mailtrap';
    protected $description = 'Envía un mail de prueba a Mailtrap';

    public function handle()
    {
        Mail::raw('Este es un test simple desde Laravel.', function ($message) {
            $message->to('pablonauta@gmail.com')
                    ->subject('Test desde Laravel');
        });

        $this->info('Correo enviado. Revisá Mailtrap.');
    }
}
