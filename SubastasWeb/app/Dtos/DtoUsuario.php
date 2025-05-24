<?php

namespace App\DTOs;

class DtoUsuario {
    public $id;
    public $nombre;
    public $cedula;
    public $email;
    public $telefono;
    public $imagen;
    public $contrasenia;
    public $direccionFiscal;
    public $latitud;
    public $longitud;

    public function __construct($nombre, $cedula, $email, $telefono, $imagen, $contrasenia, $direccionFiscal, $latitud, $longitud) {
        $this->id = null;
        $this->nombre = $nombre;
        $this->cedula = $cedula;
        $this->email = $email;
        $this->telefono = $telefono;
        $this->imagen = $imagen;
        $this->contrasenia = $contrasenia;
        $this->direccionFiscal = $direccionFiscal;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'cedula' => $this->cedula,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'imagen' => $this->imagen,
            'contrasenia' => $this->contrasenia,
            'direccionFiscal' => $this->direccionFiscal,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud
        ];
    }
}