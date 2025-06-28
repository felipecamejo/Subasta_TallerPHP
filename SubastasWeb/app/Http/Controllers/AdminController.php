<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use OpenApi\Annotations as OA;

/**
* @OA\Tag(
*     name="Admin",
*     description="Acciones administrativas"
* )
* @OA\SecurityScheme(
*     securityScheme="bearerAuth",
*     type="http",
*     scheme="bearer",
*     bearerFormat="JWT"
* )
*/
class AdminController extends Controller {
    /**
    * @OA\Get(
    *     path="/api/admin/usuarios-pendientes",
    *     summary="Listar casas de remate pendientes de aprobación (paginado)",
    *     tags={"Admin"},
    *     security={{"bearerAuth": {}}},
    *     @OA\Parameter(
    *         name="page",
    *         in="query",
    *         description="Número de página",
    *         required=false,
    *         @OA\Schema(type="integer", example=1)
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Lista paginada de casas pendientes",
    *         @OA\JsonContent(
    *             @OA\Property(property="current_page", type="integer", example=1),
    *             @OA\Property(property="last_page", type="integer", example=5),
    *             @OA\Property(property="per_page", type="integer", example=10),
    *             @OA\Property(property="total", type="integer", example=50),
    *             @OA\Property(
    *                 property="data",
    *                 type="array",
    *                 @OA\Items(
    *                     @OA\Property(property="id", type="integer", example=1),
    *                     @OA\Property(property="idFiscal", type="string", example="212345670018"),
    *                     @OA\Property(property="aprobado_en", type="string", format="date-time", nullable=true),
    *                     @OA\Property(property="aprobado_por", type="string", nullable=true),
    *                     @OA\Property(property="usuario", type="object",
    *                         @OA\Property(property="id", type="integer", example=5),
    *                         @OA\Property(property="nombre", type="string", example="Casa Aurora"),
    *                         @OA\Property(property="email", type="string", example="casa@example.com"),
    *                         @OA\Property(property="telefono", type="string", example="099123456")
    *                     )
    *                 )
    *             )
    *         )
    *     )
    * )
    */
    public function casasPendientes(){
    try {
        // Verifica si el usuario está autenticado
        $user = Auth::user();  // Obtiene el usuario autenticado

        // Si el usuario no está autenticado, devuelve un error 401
        if (!$user) {
            return response()->json([
                'error' => 'Token inválido',
            ], 401);
        }

        // Si el token es válido, procede con la lógica original
        $pendientes = CasaRemate::where('activo', false)
            ->with('usuario')
            ->paginate(10); 

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
    *     summary="Listar casas de remate activas (paginado)",
    *     tags={"Admin"},
    *     security={{"bearerAuth": {}}},
    *     @OA\Parameter(
    *         name="page",
    *         in="query",
    *         description="Número de página",
    *         required=false,
    *         @OA\Schema(type="integer", example=1)
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Lista paginada de casas activas",
    *         @OA\JsonContent(
    *             @OA\Property(property="current_page", type="integer", example=1),
    *             @OA\Property(property="last_page", type="integer", example=5),
    *             @OA\Property(property="per_page", type="integer", example=10),
    *             @OA\Property(property="total", type="integer", example=50),
    *             @OA\Property(
    *                 property="data",
    *                 type="array",
    *                 @OA\Items(
    *                     @OA\Property(property="id", type="integer", example=2),
    *                     @OA\Property(property="idFiscal", type="string", example="211234560019"),
    *                     @OA\Property(property="aprobado_en", type="string", format="date-time", example="2025-06-19T15:45:00Z"),
    *                     @OA\Property(property="aprobado_por", type="string", example="admin@example.com"),
    *                     @OA\Property(property="usuario", type="object",
    *                         @OA\Property(property="id", type="integer", example=6),
    *                         @OA\Property(property="nombre", type="string", example="Casa Solis"),
    *                         @OA\Property(property="email", type="string", example="solis@example.com"),
    *                         @OA\Property(property="telefono", type="string", example="098765432")
    *                     )
    *                 )
    *             )
    *         )
    *     )
    * )
    */
    
    public function casasActivas(){
        
    try {
        $activas = CasaRemate::where('activo', true)
            ->with('usuario')
            ->paginate(10); 

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
    *     path="/api/admin/aprobar-casa/{usuarioId}",
    *     summary="Aprobar una casa de remate",
    *     tags={"Admin"},
    *     security={{"bearerAuth": {}}},
    *     @OA\Parameter(
    *         name="usuarioId",
    *         in="path",
    *         required=true,
    *         description="ID del usuario asociado a la casa de remate",
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
    public function aprobarCasa($usuarioId) {
        try {
            $casa = CasaRemate::where('usuario_id', $usuarioId)->firstOrFail();
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
    * @OA\Post(
    *     path="/api/admin/desaprobar-casa/{usuarioId}",
    *     summary="Desaprobar o desactivar una casa de remate",
    *     tags={"Admin"},
    *     security={{"bearerAuth": {}}},
    *     @OA\Parameter(
    *         name="usuarioId",
    *         in="path",
    *         required=true,
    *         description="ID del usuario asociado a la casa de remate",
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
    public function desaprobarCasa($usuarioId)
    {
        try {
            $casa = CasaRemate::where('usuario_id', $usuarioId)->firstOrFail();
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

    /**
    * @OA\Delete(
    *     path="/api/admin/eliminar-usuario/{usuario_id}",
    *     summary="Eliminar un usuario y su perfil asociado",
    *     tags={"Admin"},
    *     security={{"bearerAuth": {}}},
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
    public function eliminarUsuario($usuario_id){
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
 * @OA\Get(
 *     path="/api/admin/usuarios",
 *     summary="Listar usuarios por rol (paginado)",
 *     tags={"Admin"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(
 *         name="rol",
 *         in="query",
 *         required=true,
 *         description="Rol de los usuarios a listar: cliente, rematador o casa_remate",
 *         @OA\Schema(type="string", enum={"cliente", "rematador", "casa_remate"})
 *     ),
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Número de página",
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         description="Cantidad de resultados por página",
 *         @OA\Schema(type="integer", example=10)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Lista paginada de usuarios por rol",
 *         @OA\JsonContent(type="object",
 *             @OA\Property(property="current_page", type="integer"),
 *             @OA\Property(property="last_page", type="integer"),
 *             @OA\Property(property="per_page", type="integer"),
 *             @OA\Property(property="total", type="integer"),
 *             @OA\Property(
 *                 property="data",
 *                 type="array",
 *                 @OA\Items(type="object")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Rol inválido"
 *     )
 * )
 */
public function usuariosPorRol(Request $request){
    $rol = $request->query('rol');
    $perPage = $request->query('per_page', 10); // por defecto 10

    if (!in_array($rol, ['cliente', 'rematador', 'casa_remate'])) {
        return response()->json(['error' => 'Rol inválido'], 400);
    }

    $usuarios = match ($rol) {
        'cliente' => \App\Models\Cliente::with('usuario')->paginate($perPage),
        'rematador' => \App\Models\Rematador::with('usuario')->paginate($perPage),
        'casa_remate' => \App\Models\CasaRemate::with('usuario')->paginate($perPage),
    };

    return response()->json($usuarios);
}
}