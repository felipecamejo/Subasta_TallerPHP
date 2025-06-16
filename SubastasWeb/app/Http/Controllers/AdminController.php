<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Admin",
 *     description="Acciones administrativas"
 * )
 */
class AdminController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/admin/usuarios-pendientes",
     *     summary="Listar casas de remate pendientes de aprobación",
     *     tags={"Admin"},
     *     @OA\Response(response=200, description="Lista de casas pendientes")
     * )
     */
    public function casasPendientes()
    {
        $pendientes = CasaRemate::where('aprobada', false)->with('usuario')->get();
        return response()->json($pendientes);
    }

    /**
     * @OA\Post(
     *     path="/api/admin/aprobar-casa/{id}",
     *     summary="Aprobar una casa de remate",
     *     tags={"Admin"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Casa aprobada")
     * )
     */
    public function aprobarCasa($id)
    {
        $casa = CasaRemate::find($id);

        if (!$casa) {
            return response()->json(['error' => 'Casa de remate no encontrada'], 404);
        }

        $casa->aprobada = true;
        $casa->save();

        return response()->json(['message' => 'Casa de remate aprobada']);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/eliminar-usuario/{usuario_id}",
     *     summary="Eliminar un usuario y su perfil asociado",
     *     tags={"Admin"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Usuario eliminado"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function eliminarUsuario($usuario_id)
    {
        $usuario = Usuario::find($usuario_id);

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Eliminar perfil asociado (si existe)
        Cliente::where('usuario_id', $usuario_id)->delete();
        Rematador::where('usuario_id', $usuario_id)->delete();
        CasaRemate::where('usuario_id', $usuario_id)->delete();

        // Eliminar usuario
        $usuario->delete();

        return response()->json(['message' => 'Usuario y perfil asociado eliminados con éxito']);
    }
}
