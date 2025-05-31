<?php
    
namespace App\DTOs;

use App\Models\Lote;

class DtoLote{
    public $id;
    public $valorBase;
    public $pujaMinima;
    public $subasta;

    /** @var DtoPuja[] */
    public array $pujas;

    public function __construct($id, $valorBase, $pujaMinima, $subasta, $pujas){
        $this->id = $id;
        $this->valorBase = $valorBase;
        $this->pujaMinima = $pujaMinima;
        $this->subasta = $subasta;
        $this->pujas = $pujas;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'valorBase' => $this->valorBase,
            'pujaMinima' => $this->pujaMinima,
            'subasta' => $this->subasta,
            'pujas' => array_map(function($puja) {
                return $puja->toArray();
            }, $this->pujas)
        ];
    }
}

// El DTO ya tiene los atributos y el constructor correctos.
