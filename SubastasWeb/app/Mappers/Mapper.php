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
use App\DTOs\DtoRematador;

use App\Models\Articulo;
use App\Models\Lote;
use App\Models\CasaRemate;
use App\Models\Categoria;
use App\Models\Factura;
use App\Models\Notificacion;
use App\Models\Puja;
use App\Models\Vendedor;
use App\Models\Subasta;
use App\Models\Rematador;

class Mapper {

    public static function fromModelArticulo(Articulo $articulo): DtoArticulo{
        return new DtoArticulo(
            $articulo->id,
            $articulo->imagenes,
            $articulo->especificacion,
            $articulo->disponibilidad,
            $articulo->condicion,
            $articulo->vendedor_id,
            $articulo->categorias->map(function($categoria) {
                return Mapper::fromModelCategoria($categoria);
            })->toArray()
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
            $casaRemate->id,
            $casaRemate->nombre,
            $casaRemate->idFiscal,
            $casaRemate->email,
            $casaRemate->telefono,
            $casaRemate->calificacion,
            $casaRemate->rematadores->map(function($rematador) {
                return Mapper::fromModelRematador($rematador);
            })->toArray(),
            $casaRemate->subastas->map(function($subasta) {
                return Mapper::fromModelSubasta($subasta);
            })->toArray()
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
            $categoria->id,
            $categoria->nombre,
            $categoria->categoria_padre_id,
            $categoria->categoriasHijas->map(function($categoriaHija) {
                return Mapper::fromModelCategoria($categoriaHija);
            })->toArray(),
            $categoria->articulos->map(function($articulo) {
                return Mapper::fromModelArticulo($articulo);
            })->toArray()
        );
    }

    public static function toModelCategoria(DtoCategoria $dto): Categoria {
        return new Categoria([
            'nombre' => $dto->nombre,
            'categoria_padre_id' => $dto->categoria_padre_id
        ]);
    }

    public static function fromModelCliente($cliente): DtoVendedor {
        return new DtoVendedor(
            $cliente->id,
            $cliente->nombre,
            $cliente->facturas->map(function($factura) {
                return Mapper::fromModelFactura($factura);
            })->toArray(),
            $cliente->articulos->map(function($articulo) {
                return Mapper::fromModelArticulo($articulo);
            })->toArray(),
            $cliente->casasRemate->map(function($casaRemate) {
                return Mapper::fromModelCasaRemate($casaRemate);
            })->toArray()
        );
    }

    public static function fromModelFactura($factura): DtoFactura {
        return new DtoFactura(
            $factura->id,
            $factura->montoTotal,
            $factura->condicionesDePago,
            $factura->entrega,
            $factura->vendedorId,
            $factura->puja
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
            $lote->id,
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
            $notificacion->id,
            $notificacion->mensaje,
            $notificacion->clientes->map(function($cliente) { // corregido 'clienestes' -> 'clientes'
                return Mapper::fromModelCliente($cliente);
            })->toArray()
        );
    }

    public static function toModelNotificacion(DtoNotificacion $dto): Notificacion {
        return new Notificacion([
            'mensaje' => $dto->mensaje,
        ]);
    }

    public static function fromModelPuja($puja): DtoPuja {
        return new DtoPuja(
            $puja->id,
            $puja->fechaHora,
            $puja->monto,
            $puja->lote_id,
            $puja->factura_id,
            $puja->clientes->map(function($cliente) {
                return Mapper::fromModelCliente($cliente);
            })->toArray()
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
            $subasta->id,
            $subasta->duracionMinutos,
            $subasta->fecha,
            $subasta->casaremate_id,
            $subasta->rematador_id,
            $subasta->latitud,
            $subasta->longitud,
            $subasta->lotes->map(function($lote) {
                return Mapper::fromModelLote($lote);
            })->toArray()
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
            $vendedor->id,
            $vendedor->nombre,
            $vendedor->facturas->map(function($factura) {
                return Mapper::fromModelFactura($factura);
            })->toArray(),
            $vendedor->articulos->map(function($articulo) {
                return Mapper::fromModelArticulo($articulo);
            })->toArray(),
            $vendedor->casasRemate->map(function($casaRemate) {
                return Mapper::fromModelCasaRemate($casaRemate);
            })->toArray()
        );
    }

    public static function toModelVendedor(DtoVendedor $dto): Vendedor {
        return new Vendedor([
            'nombre' => $dto->nombre,
        ]);
    }

    public static function fromModelRematador($rematador) {
        return new DtoRematador(
            $rematador->id,
            $rematador->matricula,
            $rematador->usuario_id,
            $rematador->subastas->map(function($subasta) {
                return Mapper::fromModelSubasta($subasta);
            })->toArray(),
            $rematador->casasRemate->map(function($casaRemate) {
                return Mapper::fromModelCasaRemate($casaRemate);
            })->toArray()
        );
    }

    public static function toModelRematador(DtoRematador $dto): Rematador {
        return new Rematador([
            'matricula' => $dto->matricula,
        ]);
    }

    public static function fromModelUsuario($usuario): DtoRematador {
        return new DtoRematador(
            $usuario->id,
            $usuario->matricula,
            $usuario->usuario_id,
            $usuario->subastas->map(function($subasta) {
                return Mapper::fromModelSubasta($subasta);
            })->toArray(),
            $usuario->casasRemate->map(function($casaRemate) {
                return Mapper::fromModelCasaRemate($casaRemate);
            })->toArray()
        );
    }

    public static function toModelUsuario(DtoRematador $dto): Rematador {
        return new Rematador([
            'matricula' => $dto->matricula,
        ]);
    }
}