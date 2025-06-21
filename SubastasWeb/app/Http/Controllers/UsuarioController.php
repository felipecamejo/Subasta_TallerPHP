<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Usuario",
 *     description="Operaciones relacionadas al usuario autenticado"
 * )
 */
class UsuarioController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/usuario-autenticado",
     *     summary="Obtener información del usuario autenticado",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Datos del usuario autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer", example=12),
     *             @OA\Property(property="nombre", type="string", example="Juan Pérez"),
     *             @OA\Property(property="email", type="string", example="juan@example.com"),
     *             @OA\Property(property="rol", type="string", example="cliente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autenticado"
     *     )
     * )
     */
    public function autenticado(Request $request)
{
    $usuario = $request->user();

    return response()->json([
        'id' => $usuario->id,
        'nombre' => $usuario->nombre,
        'email' => $usuario->email,
        'rol' => $usuario->rol, // usa el accesor del modelo
    ]);
}

}
