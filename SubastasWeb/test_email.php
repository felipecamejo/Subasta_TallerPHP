<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Mail\NotificacionCorreo;
use Illuminate\Support\Facades\Mail;

// Simple test to verify email functionality
try {
    $email = new NotificacionCorreo('Test Subject', 'Test Message Content');
    echo "Email object created successfully!\n";
    echo "Subject: " . $email->envelope()->subject . "\n";
    echo "Content view: emails.notificacion\n";
    echo "Test completed successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
