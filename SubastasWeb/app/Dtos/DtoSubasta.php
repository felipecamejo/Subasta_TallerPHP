<?php

namespace App\DTOs;

use App\DTOs\DtoLote;

class DtoSubasta {

    public $id;
    public $nombre;
    public $duracionMinutos;
    public $fecha;
    public $casaremate;
    public $rematador;
    public $latitud;
    public $longitud;
    public $activa;

    /** @var DtoLote[] */
    public array $lotes;

    public function __construct($id, $activa, $nombre, $duracionMinutos, $fecha, $casaremate, $rematador, $latitud, $longitud, $lotes) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->duracionMinutos = $duracionMinutos;
        $this->fecha = $fecha;
        $this->casaremate = $casaremate;
        $this->rematador = $rematador;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
        $this->lotes = $lotes;
        $this->activa = $activa;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'activa' => $this->activa,
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