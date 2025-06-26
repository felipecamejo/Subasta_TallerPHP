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
     *     path="/api/autenticado",
     *     summary="Verificar si el usuario está autenticado",
     *     tags={"Usuario"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Usuario autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="autenticado", type="boolean", example=true),
     *             @OA\Property(property="usuario", type="object")
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
        return response()->json([
            'autenticado' => true,
            'usuario' => $request->user(),
        ]);
    }
}