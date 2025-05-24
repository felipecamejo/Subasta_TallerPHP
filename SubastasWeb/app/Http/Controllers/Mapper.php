<?php

use App\DTOs\DtoArticulo;
use App\DTOs\DtoLote;
use App\DTOs\DtoCasaRemate;
use App\Models\Articulo;
use App\Models\Lote;
use App\Models\CasaRemate;

class Mapper {

    public static function fromModelArticulo(Articulo $articulo): DtoArticulo{
        return new DtoArticulo(
            $articulo->imagenes,
            $articulo->especificacion,
            $articulo->disponibilidad,
            $articulo->condicion,
            $articulo->vendedor_id
        );
    }

    public static function toModelArticulo(DtoArticulo $dto): Articulo{
        return new Articulo([
            'imagenes' => $dto->imagenes,
            'especificacion' => $dto->especificacion,
            'disponibilidad' => $dto->disponibilidad,
            'condicion' => $dto->condicion,
            'vendedor_id' => $dto->vendedor_id
        ]);
    }

    public static function fromModelLote(Lote $lote): DtoLote{
        return new DtoLote(
            $lote->valorBase,
            $lote->pujaMinima
        );
    }

    public static function toModelLote(DtoLote $dto): Lote{
        return new Lote([
            'valorBase' => $dto->valorBase,
            'pujaMinima' => $dto->pujaMinima
        ]);
    }

    public static function fromModelCasaRemate(CasaRemate $casaRemate): DtoCasaRemate{
        return new DtoCasaRemate(
            $casaRemate->nombre,
            $casaRemate->idFiscal,
            $casaRemate->email,
            $casaRemate->telefono,
            $casaRemate->calificacion
        );
    }

    public static function toModelCasaRemate(DtoCasaRemate $dto): CasaRemate{
        return new CasaRemate([
            'nombre' => $dto->nombre,
            'idFiscal' => $dto->idFiscal,
            'email' => $dto->email,
            'telefono' => $dto->telefono,
            'calificacion' => $dto->calificacion
        ]);
    }



}