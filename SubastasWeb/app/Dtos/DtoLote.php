<?php
    
namespace App\DTOs;

use App\Models\Lote;

class DtoLote{
    public $id;
    public $valorBase;
    public $pujaMinima;
    public $subasta;

    public function __construct($id, $valorBase, $pujaMinima, $subasta){
        $this->id = $id;
        $this->valorBase = $valorBase;
        $this->pujaMinima = $pujaMinima;
        $this->subasta = $subasta;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'valorBase' => $this->valorBase,
            'pujaMinima' => $this->pujaMinima,
            'subasta' => $this->subasta
        ];
    }
}

// El DTO ya tiene los atributos y el constructor correctos.
