<?php

namespace App\DTOs;

use App\Dtos\DtoRematador;
use App\Dtos\DtoSubasta;
use App\Dtos\DtoUsuario;
use App\Dtos\DtoVendedor;

class DtoCasaRemate {
    public $usuario_id;
    public $idFiscal;
    
    /** @var int[] */
    public array $calificacion;

    /** @var DtoRematador[] */
    public array $rematadores;

    /** @var DtoSubasta[] */
    public array $subastas;

    /** @var DtoUsuario */
    public DtoUsuario $usuario;

    /** @var DtoVendedor|null */
    public ?DtoVendedor $vendedor;


    public function __construct(
        $usuario_id,
        $idFiscal,
        $calificacion,
        DtoUsuario $usuario,
        array $rematadores = [],
        array $subastas = [],
        ?DtoVendedor $vendedor = null
    ) {
        $this->usuario_id = $usuario_id;
        $this->idFiscal = $idFiscal;
        $this->calificacion = $calificacion;
        $this->usuario = $usuario;
        $this->rematadores = $rematadores;
        $this->subastas = $subastas;
        $this->vendedor = $vendedor;
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
            'usuario_id' => $this->usuario_id,
            'idFiscal' => $this->idFiscal,
            'calificacion' => $this->getPromedioCalificacion() ?? 0,
            'calificaciones' => $this->calificacion,
            'usuario' => $this->usuario->toArray(),
            'rematadores' => array_map(fn($r) => $r->toArray(), $this->rematadores),
            'subastas' => array_map(fn($s) => $s->toArray(), $this->subastas),
            'vendedor' => $this->vendedor?->toArray(),
        ];
    }
}