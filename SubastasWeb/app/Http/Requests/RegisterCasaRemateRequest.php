<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="RegisterCasaRemateRequest",
 *     required={
 *         "nombre", "email", "telefono", "latitud", "longitud",
 *         "idFiscal", "contrasenia", "contrasenia_confirmation"
 *     },
 *     @OA\Property(property="nombre", type="string", example="Casa de Subastas XYZ"),
 *     @OA\Property(property="email", type="string", format="email", example="casa@subastas.com"),
 *     @OA\Property(property="telefono", type="string", example="099123456"),
 *     @OA\Property(property="cedula", type="string", example="12345678"),
 *     @OA\Property(property="latitud", type="number", format="float", example=-34.901112),
 *     @OA\Property(property="longitud", type="number", format="float", example=-56.164532),
 *     @OA\Property(property="idFiscal", type="string", example="RUT123456789"),
 *     @OA\Property(property="contrasenia", type="string", format="password", example="password123"),
 *     @OA\Property(property="contrasenia_confirmation", type="string", format="password", example="password123"),
 *     @OA\Property(property="imagen", type="string", example="avatars/default1.png")
 * )
 */
class RegisterCasaRemateRequest extends FormRequest
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
            'cedula' => 'nullable|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
            'contrasenia' => 'required|string|min:8|confirmed',
            'imagen' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'El correo ya está registrado.',
            'cedula.unique' => 'La cédula ya está registrada.',
            'idFiscal.unique' => 'El ID fiscal ya fue usado.',
            'contrasenia.confirmed' => 'La confirmación de la contraseña no coincide.',
        ];
    }
}