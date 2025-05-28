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
    public $latitud;
    public $longitud;
    public $cliente;
    public $rematador;

    public function __construct($id, $nombre, $cedula, $email, $telefono, $imagen, $contrasenia, $latitud, $longitud, $rematador, $cliente) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->cedula = $cedula;
        $this->email = $email;
        $this->telefono = $telefono;
        $this->imagen = $imagen;
        $this->contrasenia = $contrasenia;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
        $this->rematador = $rematador;
        $this->cliente = $cliente;
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
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'rematador' => $this->rematador,
            'cliente' => $this->cliente
        ];
    }
}