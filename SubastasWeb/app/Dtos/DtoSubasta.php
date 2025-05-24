<?php

namespace App\DTOs;

use App\DTOs\DtoLote;

class DtoSubasta {

    public $id;
    public $duracionMinutos;
    public $fecha;
    public $casaremate_id;
    public $rematador_id;
    public $latitud;
    public $longitud;

    /** @var DtoLote[] */
    public array $lotes;

    public function __construct($duracionMinutos, $fecha, $casaremate_id, $rematador_id, $latitud, $longitud) {
        $this->id = null;
        $this->duracionMinutos = $duracionMinutos;
        $this->fecha = $fecha;
        $this->casaremate_id = $casaremate_id;
        $this->rematador_id = $rematador_id;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
        $this->lotes = [];
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'duracionMinutos' => $this->duracionMinutos,
            'fecha' => $this->fecha,
            'casaremate_id' => $this->casaremate_id,
            'rematador_id' => $this->rematador_id,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'lotes' => array_map(function($lote) {
                return $lote->toArray();
            }, $this->lotes)
        ];
    }

}