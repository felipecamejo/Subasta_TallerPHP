<?php
    
namespace App\DTOs;

use App\Models\Lote;

class DtoLote{
    public $id;
    public $valorBase;
    public $pujaMinima;
    public $subasta;
    public $umbral;
    
    /** @var DtoPuja[] */
    public array $pujas;

    /** @var DtoArticulo[] */
    public array $articulos;

    public function __construct($id, $umbral, $valorBase, $pujaMinima, $subasta, $pujas, $articulos){
        $this->id = $id;
        $this->valorBase = $valorBase;
        $this->pujaMinima = $pujaMinima;
        $this->subasta = $subasta;
        $this->pujas = $pujas;
        $this->articulos = $articulos;
        $this->umbral = $umbral;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'umbral' => $this->umbral,
            'valorBase' => $this->valorBase,
            'pujaMinima' => $this->pujaMinima,
            'subasta' => $this->subasta,
            'pujas' => array_map(function($puja) {
                return $puja->toArray();
            }, $this->pujas),
            'articulos' => array_map(function($articulo) {
                return $articulo->toArray();
            }, $this->articulos),
        ];
    }
}

// El DTO ya tiene los atributos y el constructor correctos.
