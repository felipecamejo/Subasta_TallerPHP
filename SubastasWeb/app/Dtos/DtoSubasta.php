<?php

namespace App\DTOs;

use App\DTOs\DtoLote;

class DtoSubasta {

    public $id;
    public $duracionMinutos;
    public $fecha;
    public $casaremate;
    public $rematador;
    public $latitud;
    public $longitud;

    /** @var DtoLote[] */
    public array $lotes;

    public function __construct($id, $duracionMinutos, $fecha, $casaremate, $rematador, $latitud, $longitud, $lotes) {
        $this->id = $id;
        $this->duracionMinutos = $duracionMinutos;
        $this->fecha = $fecha;
        $this->casaremate_id = $casaremate;
        $this->rematador_id = $rematador;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
        $this->lotes = $lotes;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'duracionMinutos' => $this->duracionMinutos,
            'fecha' => $this->fecha,
            'casaremate_id' => $this->casaremate,
            'rematador_id' => $this->rematador,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'lotes' => array_map(function($lote) {
                return $lote->toArray();
            }, $this->lotes)
        ];
    }

}