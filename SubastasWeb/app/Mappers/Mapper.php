<?php

namespace App\Mappers;

use App\DTOs\DtoArticulo;
use App\DTOs\DtoLote;
use App\DTOs\DtoCasaRemate;
use App\DTOs\DtoCategoria;
use App\DTOs\DtoFactura;
use App\DTOs\DtoNotificacion;
use App\DTOs\DtoPuja;
use App\DTOs\DtoVendedor;
use App\DTOs\DtoSubasta;

use App\Models\Articulo;
use App\Models\Lote;
use App\Models\CasaRemate;
use App\Models\Categoria;
use App\Models\Factura;
use App\Models\Notificacion;
use App\Models\Puja;
use App\Models\Vendedor;
use App\Models\Subasta;

class Mapper {

    public static function fromModelArticulo(Articulo $articulo): DtoArticulo{
        return new DtoArticulo(
            $articulo->imagenes,
            $articulo->especificacion,
            $articulo->disponibilidad,
            $articulo->condicion,
            $articulo->vendedor_id,
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

    public static function fromModelCategoria($categoria): DtoCategoria {
        return new DtoCategoria(
            $categoria->nombre,
            $categoria->categoria_padre_id
        );
    }

    public static function toModelCategoria(DtoCategoria $dto): Categoria {
        return new Categoria([
            'nombre' => $dto->nombre,
            'categoria_padre_id' => $dto->categoria_padre_id
        ]);
    }

    public static function fromModelFactura($factura): DtoFactura {
        return new DtoFactura(
            $factura->montoTotal,
            $factura->condicionesDePago,
            $factura->entrega,
            $factura->vendedorId,
        );
    }

    public static function toModelFactura(DtoFactura $dto): Factura {
        return new Factura([
            'montoTotal' => $dto->montoTotal,
            'condicionesDePago' => $dto->condicionesDePago,
            'entrega' => $dto->entrega,
            'vendedorId' => $dto->vendedorId,
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

    public static function fromModelNotificacion($notificacion): DtoNotificacion {
        return new DtoNotificacion(
            $notificacion->mensaje,
        );
    }

    public static function toModelNotificacion(DtoNotificacion $dto): Notificacion {
        return new Notificacion([
            'mensaje' => $dto->mensaje,
        ]);
    }

    public static function fromModelPuja($puja): DtoPuja {
        return new DtoPuja(
            $puja->fechaHora,
            $puja->monto,
            $puja->lote_id,
            $puja->factura_id
        );
    }

    public static function toModelPuja(DtoPuja $dto): Puja {
        return new Puja([
            'fechaHora' => $dto->fechaHora,
            'monto' => $dto->monto,
            'lote_id' => $dto->lote_id,
            'factura_id' => $dto->factura_id
        ]);
    }

    public static function fromModelSubasta($subasta): DtoSubasta {
        return new DtoSubasta(
            $subasta->duracionMinutos,
            $subasta->fecha,
            $subasta->casaremate_id,
            $subasta->rematador_id,
            $subasta->latitud,
            $subasta->longitud
        );
    }

    public static function toModelSubasta(DtoSubasta $dto): Subasta {
        return new Subasta([
            'duracionMinutos' => $dto->duracionMinutos,
            'fecha' => $dto->fecha,
            'casaremate_id' => $dto->casaremate_id,
            'rematador_id' => $dto->rematador_id,
            'latitud' => $dto->latitud,
            'longitud' => $dto->longitud
        ]);
    }

    public static function fromModelVendedor($vendedor): DtoVendedor {
        return new DtoVendedor(
            $vendedor->nombre,
        );
    }

    public static function toModelVendedor(DtoVendedor $dto): Vendedor {
        return new Vendedor([
            'nombre' => $dto->nombre,
        ]);
    }
}