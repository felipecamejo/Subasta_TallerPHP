<?php

namespace App\DTOs;

class DtoRematador {
    public $id;
    public $matricula;

    /** @var DtoSubasta[] */
    public array $subastas;

    /** @var DtoCasaRemate[] */
    public array $casasRemate;

    public function __construct($matricula) {
        $this->id = null;
        $this->matricula = $matricula;
        $this->subastas = [];
        $this->casasRemate = [];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'matricula' => $this->matricula,
            'subastas' => array_map(function($subasta) {
                return $subasta->toArray();
            }, $this->subastas),
            'casasRemate' => array_map(function($casaRemate) {
                return $casaRemate->toArray();
            }, $this->casasRemate)
        ];
    }
}