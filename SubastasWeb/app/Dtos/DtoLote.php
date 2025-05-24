<?php
    
namespace App\DTOs;

use App\Models\Lote;

class DtoLote{
    public $id;
    public $valorBase;
    public $pujaMinima;
    public $subasta_id;

    public function __construct($id, $valorBase, $pujaMinima, $subasta_id){
        $this->id = $id;
        $this->valorBase = $valorBase;
        $this->pujaMinima = $pujaMinima;
        $this->subasta_id = $subasta_id;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'valorBase' => $this->valorBase,
            'pujaMinima' => $this->pujaMinima,
            'subasta_id' => $this->subasta_id
        ];
    }
}

// El DTO ya tiene los atributos y el constructor correctos.
