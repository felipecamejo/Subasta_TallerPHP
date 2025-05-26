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
    
    /** @var int[] */
    public array $calificacion;

    /** @var DtoRematador[] */
    public array $rematadores;

    /** @var DtoSubasta[] */
    public array $subastas;


    public function __construct($id, $nombre, $idFiscal, $email, $telefono, $calificacion, $rematadores, $subastas) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->idFiscal = $idFiscal;
        $this->email = $email;
        $this->telefono = $telefono;
        $this->calificacion = $calificacion;
        $this->rematadores = $rematadores;
        $this->subastas = $subastas;
    }

    public function getPromedioCalificacion(): ?float
    {
        if (count($this->calificacion) === 0) {
            return null;
        }

        return round(array_sum($this->calificacion) / count($this->calificacion), 2);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'idFiscal' => $this->idFiscal,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'calificacion' => $this->getPromedioCalificacion() ?? 0,
        ];
    }
}