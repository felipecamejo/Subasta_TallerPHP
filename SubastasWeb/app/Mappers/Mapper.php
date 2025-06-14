<?php

namespace App\Mappers;

use App\DTOs\DtoArticulo;
use App\DTOs\DtoCliente;
use App\DTOs\DtoLote;
use App\DTOs\DtoCasaRemate;
use App\DTOs\DtoCategoria;
use App\DTOs\DtoFactura;
use App\DTOs\DtoNotificacion;
use App\DTOs\DtoPuja;
use App\DTOs\DtoVendedor;
use App\DTOs\DtoSubasta;
use App\DTOs\DtoRematador;
use App\DTOs\DtoUsuario;

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
use App\Models\Cliente;
use App\Models\Usuario;

class Mapper {

    public static function fromModelArticulo(Articulo $articulo, &$visited = [], $depth = null): DtoArticulo{
        if (isset($visited['articulo'][$articulo->id])) {
            return $visited['articulo'][$articulo->id];
        }

        // Load vendedor
        $dtoVendedor = null;
        if ($articulo->vendedor_id && ($depth === null || $depth > 0)) {
            if ($articulo->relationLoaded('vendedor') && $articulo->vendedor) {
                $dtoVendedor = Mapper::fromModelVendedor($articulo->vendedor, $visited, $depth !== null ? $depth - 1 : null);
            } else {
                $vendedorModel = Vendedor::find($articulo->vendedor_id);
                if ($vendedorModel instanceof Vendedor) {
                    $dtoVendedor = Mapper::fromModelVendedor($vendedorModel, $visited, $depth !== null ? $depth - 1 : null);
                }
            }
        }

        // Load categoria - Categories are basic info so we load them even at depth 0
        $categoria = null;
        if ($articulo->relationLoaded('categoria') && $articulo->categoria) {
            $categoriaModel = $articulo->categoria;
        } else {
            $categoriaModel = $articulo->categoria_id ? Categoria::find($articulo->categoria_id) : null;
        }
        
        if ($categoriaModel instanceof Categoria) {
            $categoria = ($depth === null || $depth > 0)
                ? Mapper::fromModelCategoria($categoriaModel, $visited, $depth !== null ? $depth - 1 : null)
                : new DtoCategoria($categoriaModel->id, $categoriaModel->nombre, null, [], []);
        }

        // Don't load lote from articulo to avoid circular reference
        $dtoLote = null;

        $dto = new DtoArticulo(
            $articulo->id,
            $articulo->estado,
            $articulo->nombre,
            $articulo->imagenes,
            $articulo->especificacion,
            $articulo->disponibilidad,
            $articulo->condicion,
            $dtoVendedor,
            $categoria,
            $dtoLote
        );
        $visited['articulo'][$articulo->id] = $dto;
        return $dto;
    }

    public static function toModelArticulo(DtoArticulo $dto): Articulo{
        return new Articulo([
            'nombre' => $dto->nombre,
            'estado' => $dto->estado,
            'imagenes' => $dto->imagenes,
            'especificacion' => $dto->especificacion,
            'disponibilidad' => $dto->disponibilidad,
            'condicion' => $dto->condicion,
            'vendedor_id' => $dto->vendedor->id ?? null,
            'lote_id' => $dto->lote->id ?? null,
            'categoria_id' => $dto->categoria->id ?? null
        ]);
    }

    public static function fromModelCasaRemate(CasaRemate $casaRemate, &$visited = [], $depth = null): DtoCasaRemate{
        if (isset($visited['casaremate'][$casaRemate->id])) {
            return $visited['casaremate'][$casaRemate->id];
        }

        // Create basic DTO first to prevent circular references
        $dto = new DtoCasaRemate(
            $casaRemate->id,
            $casaRemate->nombre,
            $casaRemate->idFiscal,
            $casaRemate->email,
            $casaRemate->telefono,
            is_array($casaRemate->calificacion) ? $casaRemate->calificacion : [],
            [], // Empty rematadores initially
            []  // Empty subastas initially
        );
        $visited['casaremate'][$casaRemate->id] = $dto;

        // Now load relationships if depth allows, but avoid loading subastas from casaRemate to prevent recursion
        if ($depth === null || $depth > 0) {
            $rematadoresCollection = $casaRemate->rematadores ?? collect();
            $dto->rematadores = $rematadoresCollection->map(function($rematador) use (&$visited, $depth) {
                return Mapper::fromModelRematadorSinCasaRemates($rematador, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
            
            // Don't load subastas from CasaRemate to avoid circular reference
            // The subastas will be loaded from the main Subasta query
        }

        return $dto;
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

    public static function fromModelCategoria(Categoria $categoria, &$visited = [], $depth = null): DtoCategoria {
        if (isset($visited['categoria'][$categoria->id])) {
            return $visited['categoria'][$categoria->id];
        }

        $categoriaModel = Categoria::find($categoria->categoria_padre_id);
        $dtoCategoria = ($categoriaModel instanceof Categoria && ($depth === null || $depth > 0))
            ? Mapper::fromModelCategoria($categoriaModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;

        $categoriasHijas = [];
        $articulos = [];
        if ($depth === null || $depth > 0) {
            $categoriasHijasCollection = $categoria->categoriasHijas ?? collect();
            $categoriasHijas = $categoriasHijasCollection->map(function($categoriaHija) use (&$visited, $depth) {
                return Mapper::fromModelCategoria($categoriaHija, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
            
            // Para evitar recursión infinita, cargamos los artículos con profundidad limitada
            $articulosCollection = $categoria->articulos ?? collect();
            $articulos = $articulosCollection->map(function($articulo) use (&$visited, $depth) {
                return Mapper::fromModelArticulo($articulo, $visited, $depth !== null ? max(0, $depth - 1) : 0);
            })->toArray();
        }

        $dto = new DtoCategoria(
            $categoria->id,
            $categoria->nombre,
            $dtoCategoria,
            $categoriasHijas,
            $articulos
        );
        $visited['categoria'][$categoria->id] = $dto;
        return $dto;
    }

    public static function toModelCategoria(DtoCategoria $dto): Categoria {
        return new Categoria([
            'nombre' => $dto->nombre,
            'categoria_padre_id' => $dto->categoria_padre->id ?? null,
        ]);
    }

    public static function fromModelCliente(Cliente $cliente, &$visited = [], $depth = null): DtoCliente {
        // Check if we've already mapped this cliente
        if (isset($visited['cliente'][$cliente->usuario_id])) {
            return $visited['cliente'][$cliente->usuario_id];
        }

        // Create a basic DTO first to prevent circular references
        $dto = new DtoCliente(
            $cliente->calificacion,
            [], // Empty pujas array
            [], // Empty notificaciones array
            null // No usuario yet
        );
        
        // Store it in visited immediately
        $visited['cliente'][$cliente->usuario_id] = $dto;

        // Now load relationships if depth allows
        if ($depth === null || $depth > 0) {
            // Load usuario
            if ($cliente->usuario) {
                $dto->usuario = Mapper::fromModelUsuario($cliente->usuario, $visited, $depth !== null ? $depth - 1 : null);
            }

            // Load pujas with limited depth to avoid recursion
            if ($depth !== 0 && $cliente->relationLoaded('pujas')) {
                $pujasCollection = $cliente->pujas ?? collect();
                $dto->pujas = $pujasCollection->map(function($puja) use (&$visited) {
                    // Avoid infinite recursion by checking if we're already processing this puja
                    if (isset($visited['puja'][$puja->id])) {
                        // Return a minimal puja representation to avoid full recursion
                        return [
                            'id' => $puja->id,
                            'fechaHora' => $puja->fechaHora,
                            'monto' => $puja->monto
                        ];
                    }
                    return Mapper::fromModelPuja($puja, $visited, 0);
                })->toArray();
            }

            // Load notificaciones
            $notificacionesCollection = $cliente->notificaciones ?? collect();
            $dto->notificaciones = $notificacionesCollection->map(function($notificacion) use (&$visited) {
                return Mapper::fromModelNotificacion($notificacion, $visited);
            })->toArray();
        }

        return $dto;
    }

    public static function toModelCliente(DtoCliente $dto): Cliente {
        return new Cliente([
            'usuario_id' => $dto->usuario->id ?? null,
            'calificacion' => $dto->calificacion
        ]);
    }

    public static function fromModelFactura(Factura $factura, &$visited = [], $depth = null): DtoFactura {
        if (isset($visited['factura'][$factura->id])) {
            return $visited['factura'][$factura->id];
        }

        $vendedorDto = null;
        $pujaDto = null;
        if ($depth === null || $depth > 0) {
            $nextDepth = $depth !== null ? $depth - 1 : null;

            if ($factura->relationLoaded('vendedor') && $factura->vendedor !== null) {
                $vendedorDto = Mapper::fromModelVendedor($factura->vendedor, $visited, $nextDepth);
            }

            if ($factura->relationLoaded('puja') && $factura->puja !== null) {
                $pujaDto = Mapper::fromModelPuja($factura->puja, $visited, $nextDepth);
            }
        }

        $dto = new DtoFactura(
            $factura->id,
            $factura->monto_total,
            $factura->condiciones_de_pago,
            $factura->entrega,
            $vendedorDto,
            $pujaDto
        );

        $visited['factura'][$factura->id] = $dto;

        return $dto;
    }

    public static function toModelFactura(DtoFactura $dto): Factura {
        return new Factura([
            'montoTotal' => $dto->montoTotal,
            'condicionesDePago' => $dto->condicionesDePago,
            'entrega' => $dto->entrega,
            'vendedorId' => $dto->vendedor->id ?? null,
        ]);
    }

    public static function fromModelLote(Lote $lote, &$visited = [], $depth = null): DtoLote {
        if (!$lote instanceof Lote) {
            throw new \InvalidArgumentException('Se esperaba instancia de Lote');
        }

        if (isset($visited['lote'][$lote->id])) {
            return $visited['lote'][$lote->id];
        }

        $dtoSubasta = null;

        if ($lote->subasta_id && ($depth === null || $depth > 0) && isset($visited['subasta'][$lote->subasta_id])) {
            $subastaModel = Subasta::find($lote->subasta_id);
            if ($subastaModel) {
                $dtoSubasta = new DtoSubasta(
                    $subastaModel->id,
                    $subastaModel->loteIndex,
                    $subastaModel->videoId,
                    $subastaModel->activa,
                    $subastaModel->nombre,
                    $subastaModel->duracionMinutos,
                    $subastaModel->fecha,
                    null, 
                    null, 
                    $subastaModel->latitud,
                    $subastaModel->longitud,
                    []
                );
            }
        }

        $pujas = [];
        if ($depth === null || $depth > 0) {
            if ($lote->relationLoaded('pujas')) {
                $pujasCollection = $lote->pujas ?? collect();
                $pujas = $pujasCollection->map(function($puja) use (&$visited, $depth) {
                    if (isset($visited['puja'][$puja->id])) {
                        return [
                            'id' => $puja->id,
                            'fechaHora' => $puja->fechaHora,
                            'monto' => $puja->monto
                        ];
                    }
                    return Mapper::fromModelPuja($puja, $visited, $depth !== null ? $depth - 1 : null);
                })->toArray();
            }
        }

        $articulos = [];
        if ($depth === null || $depth > 0) {
            // Process articulos if the relationship is loaded
            if ($lote->relationLoaded('articulos')) {
                $articulosCollection = $lote->articulos ?? collect();
                $articulos = $articulosCollection->map(function($articulo) use (&$visited, $depth) {
                    return Mapper::fromModelArticulo($articulo, $visited, $depth !== null ? $depth - 1 : null);
                })->toArray();
            } else {
                // If not loaded via eager loading, try to load manually
                $articulosCollection = $lote->articulos ?? collect();
                if ($articulosCollection->count() > 0) {
                    $articulos = $articulosCollection->map(function($articulo) use (&$visited, $depth) {
                        return Mapper::fromModelArticulo($articulo, $visited, $depth !== null ? $depth - 1 : null);
                    })->toArray();
                }
            }
        }

        $dto = new DtoLote(
            $lote->id,
            $lote->umbral,
            $lote->valorBase,
            $lote->pujaMinima,
            $dtoSubasta,
            $pujas,
            $articulos
        );

        $visited['lote'][$lote->id] = $dto;

        return $dto;
    }

    public static function toModelLote(DtoLote $dto): Lote{
        return new Lote([
            'valorBase' => $dto->valorBase,
            'pujaMinima' => $dto->pujaMinima,
            'subasta_id' => $dto->subasta->id ?? null,
            'umbral' => $dto->umbral,
        ]);
    }

    public static function fromModelNotificacion(Notificacion $notificacion, &$visited = []): DtoNotificacion {
        if (isset($visited['notificacion'][$notificacion->id])) {
            return $visited['notificacion'][$notificacion->id];
        }

        $clientesCollection = $notificacion->clientes ?? collect();
        $dto = new DtoNotificacion(
            $notificacion->id,
            $notificacion->titulo,
            $notificacion->mensaje,
            $notificacion->fecha_hora,
            $notificacion->es_mensaje_chat,
            $clientesCollection->map(function($cliente) use (&$visited) {
                return Mapper::fromModelCliente($cliente, $visited);
            })->toArray()
        );
        $visited['notificacion'][$notificacion->id] = $dto;
        return $dto;
    }

    public static function toModelNotificacion(DtoNotificacion $dto): Notificacion {
        return new Notificacion([
            'titulo' => $dto->titulo,
            'mensaje' => $dto->mensaje,
            'fecha_hora' => $dto->fechaHora,
            'es_mensaje_chat' => $dto->esMensajeChat
        ]);
    }

 
    public static function fromModelPuja(Puja $puja, &$visited = [], $depth = null): DtoPuja {
        if (isset($visited['puja'][$puja->id])) {
            return $visited['puja'][$puja->id];
        }

        $dto = new DtoPuja(
            $puja->id,
            $puja->fechaHora,
            $puja->monto,
            null, 
            null, 
            null  
        );
        
        $visited['puja'][$puja->id] = $dto;

        if ($depth === null || $depth > 0) {
            $nextDepth = $depth !== null ? $depth - 1 : null;

            if ($puja->relationLoaded('lote') && $puja->lote) {
                $dto->lote_id = Mapper::fromModelLote($puja->lote, $visited, $nextDepth);
            }

            if ($puja->relationLoaded('factura') && $puja->factura) {
                $dto->factura_id = Mapper::fromModelFactura($puja->factura, $visited, $nextDepth);
            }

            if ($puja->relationLoaded('cliente') && $puja->cliente && $depth !== 0) {
                $dto->cliente = Mapper::fromModelCliente($puja->cliente, $visited, 0);
            }
        }

        return $dto;
    }   

    public static function toModelPuja(DtoPuja $dto): Puja {
        return new Puja([
            'fechaHora' => $dto->fechaHora,
            'monto' => $dto->monto,
            'lote_id' => $dto->lote?->id ?? null,
            'factura_id' => $dto->factura?->id ?? null,
            'cliente_id' => $dto->cliente?->id ?? null,
        ]);
    }
    public static function fromModelSubasta(Subasta $subasta, &$visited = [], $depth = null): DtoSubasta {

        if (isset($visited['subasta'][$subasta->id])) {
            return $visited['subasta'][$subasta->id];
        }

        // Load CasaRemate with reduced depth to avoid circular references
        $dtoCasaRemate = null;
        if ($subasta->casa_remate_id && ($depth === null || $depth > 0)) {
            if ($subasta->relationLoaded('casaRemate') && $subasta->casaRemate) {
                $dtoCasaRemate = Mapper::fromModelCasaRemate($subasta->casaRemate, $visited, 1); // Fixed depth to avoid recursion
            } else {
                $casaremateModel = CasaRemate::find($subasta->casa_remate_id);
                if ($casaremateModel instanceof CasaRemate) {
                    $dtoCasaRemate = Mapper::fromModelCasaRemate($casaremateModel, $visited, 1);
                }
            }
        }

        // Load Rematador
        $dtoRematador = null;
        if ($subasta->rematador_id && ($depth === null || $depth > 0)) {
            if ($subasta->relationLoaded('rematador') && $subasta->rematador) {
                $dtoRematador = Mapper::fromModelRematador($subasta->rematador, $visited, $depth !== null ? $depth - 1 : null);
            } else {
                $rematadorModel = Rematador::find($subasta->rematador_id);
                if ($rematadorModel instanceof Rematador) {
                    $dtoRematador = Mapper::fromModelRematador($rematadorModel, $visited, $depth !== null ? $depth - 1 : null);
                }
            }
        }

        // Load Lotes
        $lotes = [];
        if ($depth === null || $depth > 0) {
            if ($subasta->relationLoaded('lotes')) {
                $lotesCollection = $subasta->lotes ?? collect();
                $lotes = $lotesCollection->map(function($lote) use (&$visited, $depth) {
                    return Mapper::fromModelLote($lote, $visited, $depth !== null ? $depth - 1 : null);
                })->toArray();
            }
        }

        $dto = new DtoSubasta(
            $subasta->id,
            $subasta->loteIndex,
            $subasta->videoId,
            $subasta->activa,
            $subasta->nombre,
            $subasta->duracionMinutos,
            $subasta->fecha,
            $dtoCasaRemate,
            $dtoRematador,
            $subasta->latitud,
            $subasta->longitud,
            $lotes
        );
        $visited['subasta'][$subasta->id] = $dto;
        return $dto;
    }

    public static function toModelSubasta(DtoSubasta $dto): Subasta {
        return new Subasta([
            'nombre' => $dto->nombre,
            'activa' => $dto->activa,
            'duracionMinutos' => $dto->duracionMinutos,
            'fecha' => $dto->fecha,
            'casa_remate_id' => $dto->casaremate->id ?? null,
            'rematador_id' => $dto->rematador->id ?? null,
            'latitud' => $dto->latitud,
            'longitud' => $dto->longitud,
            'videoId' => $dto->videoId,
            'loteIndex' => $dto->loteIndex,
        ]);
    }

    public static function fromModelVendedor(Vendedor $vendedor, &$visited = [], $depth = null): DtoVendedor {
        if (isset($visited['vendedor'][$vendedor->id])) {
            return $visited['vendedor'][$vendedor->id];
        }

        $facturas = [];
        $articulos = [];
        $casasRemate = [];
        
        if ($depth === null || $depth > 0) {
            $facturasCollection = $vendedor->facturas ?? collect();
            $facturas = $facturasCollection->map(function($factura) use (&$visited, $depth) {
                return Mapper::fromModelFactura($factura, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();

            $articulosCollection = $vendedor->articulos ?? collect();
            $articulos = $articulosCollection->map(function($articulo) use (&$visited, $depth) {
                return Mapper::fromModelArticulo($articulo, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();

            $casasRemateCollection = $vendedor->casasRemate ?? collect();
            $casasRemate = $casasRemateCollection->map(function($casaRemate) use (&$visited, $depth) {
                return Mapper::fromModelCasaRemate($casaRemate, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
        }

        $dto = new DtoVendedor(
            $vendedor->id,
            $vendedor->nombre,
            $facturas,
            $articulos,
            $casasRemate
        );
        $visited['vendedor'][$vendedor->id] = $dto;
        return $dto;
    }

    public static function toModelVendedor(DtoVendedor $dto): Vendedor {
        return new Vendedor([
            'nombre' => $dto->nombre,
        ]);
    }

    public static function fromModelRematador(Rematador $rematador, &$visited = [], $depth = null) {
        if (isset($visited['rematador'][$rematador->id])) {
            return $visited['rematador'][$rematador->id];
        }

        $usuarioModel = Usuario::find($rematador->usuario_id);
        $dtoUsuario = ($usuarioModel instanceof Usuario && ($depth === null || $depth > 0))
            ? Mapper::fromModelUsuario($usuarioModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;

        $subastas = [];
        $casasRemate = [];
        if ($depth === null || $depth > 0) {
            $subastasCollection = $rematador->subastas ?? collect();
            $subastas = $subastasCollection->map(function($subasta) use (&$visited, $depth) {
                return Mapper::fromModelSubasta($subasta, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
            $casasRemateCollection = $rematador->casasRemate ?? collect();
            $casasRemate = $casasRemateCollection->map(function($casaRemate) use (&$visited, $depth) {
                return Mapper::fromModelCasaRemate($casaRemate, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
        }

        $dto = new DtoRematador(
            $rematador->matricula,
            $dtoUsuario,
            $subastas,
            $casasRemate
        );
        $visited['rematador'][$rematador->id] = $dto;
        return $dto;
    }

    public static function fromModelRematadorSinCasaRemates(Rematador $rematador, &$visited = [], $depth = null) {
        if (isset($visited['rematador'][$rematador->id])) {
            return $visited['rematador'][$rematador->id];
        }

        $usuarioModel = Usuario::find($rematador->usuario_id);
        $dtoUsuario = ($usuarioModel instanceof Usuario && ($depth === null || $depth > 0))
            ? Mapper::fromModelUsuario($usuarioModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;

        $dto = new DtoRematador(
            $rematador->matricula,
            $dtoUsuario,
            [], // No subastas desde CasaRemates
            []  // No casas de remate desde CasaRemates
        );
        $visited['rematador'][$rematador->id] = $dto;
        return $dto;
    }

    public static function fromModelUsuario(Usuario $usuario, &$visited = [], $depth = null): DtoUsuario {
        if (isset($visited['usuario'][$usuario->id])) {
            return $visited['usuario'][$usuario->id];
        }

        $usuarioModel = Usuario::find($usuario->id);
        $dtoUsuario = ($usuarioModel instanceof Usuario && ($depth === null || $depth > 0))
            ? Mapper::fromModelUsuario($usuarioModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;
        $clienteModel = $usuario ->cliente ?? null;
        $dtoCliente = ($clienteModel instanceof Cliente && ($depth === null || $depth > 0))
            ? Mapper::fromModelCliente($clienteModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;
        $rematadorModel = $usuario ->rematador ?? null;
        $dtoRematador = ($rematadorModel instanceof Rematador && ($depth === null || $depth > 0))
            ? Mapper::fromModelRematador($rematadorModel, $visited, $depth !== null ? $depth - 1 : null)
            : null;

        $subastas = [];
        $casasRemate = [];
        if ($depth === null || $depth > 0) {
            $subastasCollection = $usuario->subastas ?? collect();
            $subastas = $subastasCollection->map(function($subasta) use (&$visited, $depth) {
                return Mapper::fromModelSubasta($subasta, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
            $casasRemateCollection = $usuario->casasRemate ?? collect();
            $casasRemate = $casasRemateCollection->map(function($casaRemate) use (&$visited, $depth) {
                return Mapper::fromModelCasaRemate($casaRemate, $visited, $depth !== null ? $depth - 1 : null);
            })->toArray();
        }

        $dto = new DtoUsuario(
            $usuario->id,
            $usuario->nombre,
            $usuario->cedula,
            $usuario->email,
            $usuario->telefono,
            $usuario->imagen,
            $usuario->contrasenia,
            $usuario->latitud,
            $usuario->longitud,
            $dtoRematador,
            $dtoCliente,
            
        );
        $visited['usuario'][$usuario->id] = $dto;
        return $dto;
    }
}