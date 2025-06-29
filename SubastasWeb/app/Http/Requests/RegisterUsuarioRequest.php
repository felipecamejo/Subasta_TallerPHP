<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="RegisterUsuarioRequest",
 *     required={"nombre", "email", "telefono", "cedula", "contrasenia", "latitud", "longitud", "rol"},
 *     @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *     @OA\Property(property="email", type="string", format="email", example="juan@example.com"),
 *     @OA\Property(property="telefono", type="string", example="091234567"),
 *     @OA\Property(property="cedula", type="string", example="12345678"),
 *     @OA\Property(property="contrasenia", type="string", format="password", example="password123"),
 *     @OA\Property(property="contrasenia_confirmation", type="string", format="password", example="password123"),
 *     @OA\Property(property="latitud", type="number", format="float", example="-34.9011"),
 *     @OA\Property(property="longitud", type="number", format="float", example="-56.1645"),
 *     @OA\Property(property="rol", type="string", enum={"cliente", "rematador"}, example="cliente"),
 *     @OA\Property(property="matricula", type="string", example="RM12345"),
 *     @OA\Property(
 *         property="imagen",
 *         type="string",
 *         format="binary",
 *         description="Imagen de perfil opcional"
 *     )
 * )
 */
class RegisterUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'contrasenia' => 'required|string|min:8|confirmed',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'rol' => 'required|in:cliente,rematador',
            'imagen' => 'nullable|image|max:2048',
            'matricula' => 'nullable|string',
        ];
    }
}