<?php
    
namespace App\DTOs;

use App\Models\Lote;

class DtoLote{
    public $id;
    public $valorBase;
    public $pujaMinima;

    public function __construct($valorBase, $pujaMinima){
        $this->id = null;
        $this->valorBase = $valorBase;
        $this->pujaMinima = $pujaMinima;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'valorBase' => $this->valorBase,
            'pujaMinima' => $this->pujaMinima,
        ];
    }
}
