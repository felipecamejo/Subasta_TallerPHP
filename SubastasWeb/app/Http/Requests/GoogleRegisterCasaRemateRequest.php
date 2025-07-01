<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="GoogleRegisterCasaRemateRequest",
 *     required={"google_id", "nombre", "email", "telefono", "cedula", "latitud", "longitud", "idFiscal"},
 *     @OA\Property(property="google_id", type="string", example="1234567890"),
 *     @OA\Property(property="nombre", type="string", example="Casa Rematadora S.A."),
 *     @OA\Property(property="email", type="string", format="email", example="casa@example.com"),
 *     @OA\Property(property="telefono", type="string", example="099123456"),
 *     @OA\Property(property="cedula", type="string", example="12345678"),
 *     @OA\Property(property="latitud", type="number", format="float", example="-34.9011"),
 *     @OA\Property(property="longitud", type="number", format="float", example="-56.1645"),
 *     @OA\Property(property="idFiscal", type="string", example="RUT123456789"),
 *     @OA\Property(property="imagen_url", type="string", format="url", nullable=true, example="https://example.com/avatar.jpg")
 * )
 */
class GoogleRegisterCasaRemateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
            'imagen_url' => 'nullable|url',
        ];
    }
}
