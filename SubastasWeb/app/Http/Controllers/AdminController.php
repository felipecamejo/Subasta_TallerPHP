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
     *     @OA\Response(
     *         response=200,
     *         description="Lista de casas pendientes",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="idFiscal", type="string", example="212345670018"),
     *                 @OA\Property(property="aprobada", type="boolean", example=false),
     *                 @OA\Property(property="usuario", type="object",
     *                     @OA\Property(property="id", type="integer", example=5),
     *                     @OA\Property(property="nombre", type="string", example="Casa Aurora"),
     *                     @OA\Property(property="email", type="string", example="casa@example.com")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function casasPendientes()
{
    try {
        $pendientes = CasaRemate::where('activo', false)
            ->with('usuario')
            ->get();

        return response()->json($pendientes);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al obtener casas pendientes',
            'mensaje' => $e->getMessage(),
        ], 500);
    }
}
    /**
     * @OA\Get(
     *     path="/api/admin/casas-activas",
     *     summary="Listar casas de remate activas",
     *     tags={"Admin"},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de casas activas",
     *         @OA\JsonContent(type="array", @OA\Items(type="object"))
     *     )
     * )
     */
    public function casasActivas()
{
    try {
        $activas = CasaRemate::where('activo', true)
            ->with('usuario')
            ->get();

        return response()->json($activas);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al obtener casas activas',
            'mensaje' => $e->getMessage(),
        ], 500);
    }
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
     *         description="ID de la casa de remate",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Casa aprobada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Casa de remate aprobada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Casa no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Casa de remate no encontrada")
     *         )
     *     )
     * )
     */
    public function aprobarCasa($id)
{
    try {
        $casa = CasaRemate::findOrFail($id);
        $casa->activo = true;
        $casa->aprobado_en = now();
        $casa->aprobado_por = auth()->user()?->email ?? 'admin';
        $casa->save();

        return response()->json(['message' => 'Casa de remate aprobada']);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'No se pudo aprobar la casa',
            'mensaje' => $e->getMessage()
        ], 500);
    }
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
     *         description="ID del usuario",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario eliminado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario y perfil asociado eliminados con éxito")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Usuario no encontrado",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Usuario no encontrado")
     *         )
     *     )
     * )
     */
    public function eliminarUsuario($usuario_id)
    {
        $usuario = Usuario::find($usuario_id);

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        Cliente::where('usuario_id', $usuario_id)->delete();
        Rematador::where('usuario_id', $usuario_id)->delete();
        CasaRemate::where('usuario_id', $usuario_id)->delete();

        $usuario->delete();

        return response()->json(['message' => 'Usuario y perfil asociado eliminados con éxito']);
    }

    /**
 * @OA\Post(
 *     path="/api/admin/desaprobar-casa/{id}",
 *     summary="Desaprobar o desactivar una casa de remate",
 *     tags={"Admin"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="ID de la casa de remate",
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Casa desaprobada",
 *         @OA\JsonContent(
 *             @OA\Property(property="message", type="string", example="Casa de remate desaprobada")
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Casa no encontrada",
 *         @OA\JsonContent(
 *             @OA\Property(property="error", type="string", example="Casa de remate no encontrada")
 *         )
 *     )
 * )
 */
    public function desaprobarCasa($id){
        try {
            $casa = CasaRemate::findOrFail($id);
            $casa->activo = false;
            $casa->aprobado_en = null;
            $casa->save();

            return response()->json(['message' => 'Casa de remate desaprobada']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo desaprobar la casa',
                'mensaje' => $e->getMessage()
            ], 500);
        }

    }
}
