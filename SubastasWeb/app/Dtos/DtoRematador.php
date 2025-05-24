<?php

namespace App\DTOs;

class DtoRematador {
    public $id;
    public $matricula;
    public $usuario_id;

    /** @var DtoSubasta[] */
    public array $subastas;

    /** @var DtoCasaRemate[] */
    public array $casasRemate;

    public function __construct($matricula, $usuario_id, $subastas, $casasRemate) {
        $this->id = null;
        $this->matricula = $matricula;
        $this->usuario_id = $usuario_id;
        $this->subastas = $subastas;
        $this->casasRemate = $casasRemate;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'matricula' => $this->matricula,
            'usuario_id' => $this->usuario_id,
            'subastas' => array_map(function($subasta) {
                return $subasta->toArray();
            }, $this->subastas),
            'casasRemate' => array_map(function($casaRemate) {
                return $casaRemate->toArray();
            }, $this->casasRemate)
        ];
    }
}