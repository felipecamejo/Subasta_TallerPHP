<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="GoogleRegisterRequest",
 *     required={"google_id", "nombre", "email", "telefono", "cedula", "latitud", "longitud", "rol"},
 *     @OA\Property(property="google_id", type="string", example="1234567890"),
 *     @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *     @OA\Property(property="email", type="string", format="email", example="juan@example.com"),
 *     @OA\Property(property="telefono", type="string", example="099123456"),
 *     @OA\Property(property="cedula", type="string", example="12345678"),
 *     @OA\Property(property="latitud", type="number", format="float", example="-34.9011"),
 *     @OA\Property(property="longitud", type="number", format="float", example="-56.1645"),
 *     @OA\Property(property="rol", type="string", enum={"cliente", "rematador", "casa_remate"}, example="cliente"),
 *     @OA\Property(property="matricula", type="string", nullable=true, example="MAT1234"),
 *     @OA\Property(property="imagen_url", type="string", format="url", nullable=true, example="https://example.com/avatar.jpg")
 * )
 */
class GoogleRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Permitir sin autenticación
    }

    public function rules(): array
    {
        return [
            'google_id' => 'required|string|unique:usuarios,google_id',
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'rol' => 'required|in:cliente,rematador,casa_remate',
            'matricula' => 'nullable|string',
            'imagen_url' => 'nullable|url',
        ];
    }

    public function messages(): array
    {
        return [
            'google_id.required' => 'El ID de Google no vino.',
            'email.unique' => 'El email ya está registrado.',
            'cedula.unique' => 'La cédula ya está registrada.',
            'imagen_url.url' => 'La URL de la imagen no es válida.',
        ];
    }
}