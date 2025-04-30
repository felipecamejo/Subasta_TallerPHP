<?php

require_once 'Usuario.php';

class Cliente extends Usuario {
    private array $notificaciones;
    private float $calificacion;

    public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtDireccion $direccionFiscal, string $imagen, array $notificaciones, float $calificacion) {
        parent::__construct($nombre, $cedula, $email, $telefono, $direccionFiscal, $imagen);
        $this->notificaciones = $notificaciones;
        $this->calificacion = $calificacion;
    }

    public function getNotificaciones(): array {
        return $this->notificaciones;
    }

    public function setNotificaciones(array $notificaciones): void {
        $this->notificaciones = $notificaciones;
    }

    public function getCalificacion(): float {
        return $this->calificacion;
    }

    public function setCalificacion(float $calificacion): void {
        $this->calificacion = $calificacion;
    }
}