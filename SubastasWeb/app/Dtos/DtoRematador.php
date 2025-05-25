<?php

namespace App\DTOs;

class DtoRematador {
    public $id;
    public $matricula;
    public $usuario;

    /** @var DtoSubasta[] */
    public array $subastas;

    /** @var DtoCasaRemate[] */
    public array $casasRemate;

    public function __construct($id, $matricula, $usuario, $subastas, $casasRemate) {
        $this->id = $id;
        $this->matricula = $matricula;
        $this->usuario = $usuario;
        $this->subastas = $subastas;
        $this->casasRemate = $casasRemate;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'matricula' => $this->matricula,
            'usuario' => $this->usuario,
            'subastas' => array_map(function($subasta) {
                return $subasta->toArray();
            }, $this->subastas),
            'casasRemate' => array_map(function($casaRemate) {
                return $casaRemate->toArray();
            }, $this->casasRemate)
        ];
    }
}