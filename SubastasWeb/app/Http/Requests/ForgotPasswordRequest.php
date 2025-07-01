<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
/**
 * @OA\Schema(
 *     schema="ForgotPasswordRequest",
 *     required={"email"},
 *     @OA\Property(property="email", type="string", format="email", example="elchati@adinet.com.uy")
 * )
 */
class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:usuarios,email',
        ];
    }
}