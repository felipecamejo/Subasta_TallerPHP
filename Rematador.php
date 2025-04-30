<?php

require_once 'Usuario.php';

class Rematador extends Usuario {
    private string $matricula;

    public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtDireccion $direccionFiscal, string $imagen, string $matricula) {
        parent::__construct($nombre, $cedula, $email, $telefono, $direccionFiscal, $imagen);
        $this->matricula = $matricula;
    }

    public function getMatricula(): string {
        return $this->matricula;
    }

    public function setMatricula(string $matricula): void {
        $this->matricula = $matricula;
    }
}