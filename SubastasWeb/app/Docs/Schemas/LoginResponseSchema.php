<?php

namespace App\Docs\Schemas;

/**
 * @OA\Schema(
 *     schema="LoginResponse",
 *     type="object",
 *     @OA\Property(property="token", type="string", example="1|abc123..."),
 *     @OA\Property(property="usuario_id", type="integer", example=12),
 *     @OA\Property(property="rol", type="string", example="cliente"),
 *     @OA\Property(
 *         property="usuario",
 *         type="object",
 *         @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *         @OA\Property(property="email", type="string", example="juan@example.com"),
 *         @OA\Property(property="imagen", type="string", example="https://example.com/avatar.jpg")
 *     )
 * )
 */
class LoginResponseSchema {}