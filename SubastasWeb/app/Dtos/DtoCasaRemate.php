<?php

namespace App\DTOs;

use App\Dtos\DtoRematador;
use App\Dtos\DtoSubasta;

class DtoCasaRemate {

    public $id;
    public $nombre;
    public $idFiscal;
    public $email;  
    public $telefono;
    public $calificacion;

    /** @var DtoRematador[] */
    public array $rematadores;

    /** @var DtoSubasta[] */
    public array $subastas;


    public function __construct($nombre, $idFiscal, $email, $telefono, $calificacion) {
        $this->id = null;
        $this->nombre = $nombre;
        $this->idFiscal = $idFiscal;
        $this->email = $email;
        $this->telefono = $telefono;
        $this->calificacion = $calificacion;
        $this->rematadores = [];
        $this->subastas = [];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'idFiscal' => $this->idFiscal,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'calificacion' => $this->calificacion
        ];
    }
}