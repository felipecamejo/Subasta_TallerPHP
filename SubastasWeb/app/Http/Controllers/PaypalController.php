<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Factura;
use App\Models\Pago;
use Illuminate\Support\Facades\Log;

class PaypalController extends Controller
{
    private $clientId;
    private $clientSecret;
    private $mode; // sandbox o live

    public function __construct()
    {
        $this->clientId = env('PAYPAL_CLIENT_ID', 'AZpt3wDVYu1SOUkbE0V_OZvXq7n1DqwFry0sYeRkAlRyf3yhhXJ5HTrJpNuL6qEA_6KKZpSRiKwNl9a7');
        $this->clientSecret = env('PAYPAL_CLIENT_SECRET', 'EDNI5MIpK2ZDPwwgp9xn3413X8dZsr-_LSvwFcM0Xm-NAkB-eoXKL1d8ptqSAn3_WqzJFEXAjXR0msQ3');
        $this->mode = env('PAYPAL_MODE', 'sandbox');
    }

    private function getPaypalUrl()
    {
        return $this->mode === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';
    }

    private function getAccessToken()
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post($this->getPaypalUrl() . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);
            
            if (!$response->successful()) {
                Log::error('Error getting PayPal access token', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Error getting PayPal access token: ' . $response->body());
            }
            
            return $response->json()['access_token'];
        } catch (\Exception $e) {
            Log::error('Exception getting PayPal access token: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * @OA\Post(
     *     path="/api/paypal/create-order",
     *     summary="Crear una nueva orden de pago en PayPal",
     *     tags={"PayPal"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"factura_id", "amount"},
     *             @OA\Property(property="factura_id", type="integer"),
     *             @OA\Property(property="amount", type="number", format="float")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Orden creada exitosamente"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Error de validación o al crear la orden"
     *     )
     * )
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'factura_id' => 'required|exists:facturas,id',
            'amount' => 'required|numeric|min:0.01'
        ]);

        try {
            $factura = Factura::findOrFail($request->factura_id);
            
            $accessToken = $this->getAccessToken();
            
            $response = Http::withToken($accessToken)
                ->post($this->getPaypalUrl() . '/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'purchase_units' => [
                        [
                            'reference_id' => (string) $factura->id,
                            'description' => "Pago por subasta #" . $factura->id,
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => number_format($request->amount, 2, '.', '')
                            ]
                        ]
                    ],
                    'application_context' => [
                        'return_url' => url('/api/paypal/success'),
                        'cancel_url' => url('/api/paypal/cancel')
                    ]
                ]);
            
            if (!$response->successful()) {
                Log::error('Error creating PayPal order', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return response()->json([
                    'success' => false, 
                    'message' => 'Error creating PayPal order', 
                    'data' => $response->json()
                ], 400);
            }
            
            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('Exception creating PayPal order: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error creating PayPal order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/paypal/capture-payment",
     *     summary="Capturar un pago de PayPal",
     *     tags={"PayPal"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"order_id"},
     *             @OA\Property(property="order_id", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Pago capturado exitosamente"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Error al capturar el pago"
     *     )
     * )
     */
    public function capturePayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string'
        ]);

        try {
            $accessToken = $this->getAccessToken();
            
            $response = Http::withToken($accessToken)
                ->post($this->getPaypalUrl() . "/v2/checkout/orders/{$request->order_id}/capture");
                
            $data = $response->json();
            
            if ($response->successful() && isset($data['status']) && $data['status'] === 'COMPLETED') {
                // Obtener ID de factura del reference_id
                $facturaId = $data['purchase_units'][0]['reference_id'] ?? null;
                
                // Registrar el pago en la base de datos
                $payment = new Pago();
                $payment->factura_id = $facturaId;
                $payment->transaction_id = $data['id'];
                $payment->amount = $data['purchase_units'][0]['payments']['captures'][0]['amount']['value'] ?? 0;
                $payment->status = $data['status'];
                $payment->payment_method = 'paypal';
                $payment->payment_details = json_encode($data);
                $payment->save();
                
                // Actualizar la factura
                $factura = Factura::find($facturaId);
                if ($factura) {
                    $factura->estado = 'pagado';
                    $factura->save();
                }
                
                return response()->json(['success' => true, 'data' => $data]);
            }
            
            Log::error('Error capturing PayPal payment', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return response()->json([
                'success' => false, 
                'message' => 'Error capturing payment', 
                'data' => $data
            ], 400);
        } catch (\Exception $e) {
            Log::error('Exception capturing PayPal payment: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error capturing payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/paypal/webhook",
     *     summary="Webhook para recibir notificaciones de PayPal",
     *     tags={"PayPal"},
     *     @OA\Response(
     *         response=200,
     *         description="Notificación procesada correctamente"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Error al procesar la notificación"
     *     )
     * )
     */
    public function webhook(Request $request)
    {
        try {
            // Verificar que la notificación es auténtica
            $verified = $this->verifyWebhook($request);
            if (!$verified) {
                Log::warning('Invalid PayPal webhook signature');
                return response()->json(['error' => 'Invalid webhook signature'], 400);
            }
            
            $data = $request->all();
            Log::info('PayPal webhook received', ['event_type' => $data['event_type'] ?? 'unknown']);
            
            // Procesar eventos específicos de PayPal
            if (isset($data['event_type']) && $data['event_type'] === 'PAYMENT.CAPTURE.COMPLETED') {
                $resource = $data['resource'] ?? [];
                
                // Actualizar el estado del pago en la base de datos
                $payment = Pago::where('transaction_id', $resource['id'] ?? '')->first();
                if ($payment) {
                    $payment->status = 'completed';
                    $payment->save();
                    
                    // Actualizar factura
                    $factura = Factura::find($payment->factura_id);
                    if ($factura) {
                        $factura->estado = 'pagado';
                        $factura->save();
                    }
                }
            }
            
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Exception processing PayPal webhook: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error processing webhook: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function verifyWebhook(Request $request)
    {
        // En entorno de desarrollo local (localhost) retornamos true 
        // para permitir pruebas sin necesidad de configurar un webhook real
        if (app()->environment('local')) {
            Log::info('Desarrollo local: Omitiendo verificación de webhook PayPal');
            return true;
        }
        
        try {
            $accessToken = $this->getAccessToken();
            
            $headers = $request->header();
            $webhookId = env('PAYPAL_WEBHOOK_ID', ''); 
            
            // Preparar los datos para la verificación
            $data = [
                'auth_algo' => $headers['paypal-auth-algo'][0] ?? '',
                'cert_url' => $headers['paypal-cert-url'][0] ?? '',
                'transmission_id' => $headers['paypal-transmission-id'][0] ?? '',
                'transmission_sig' => $headers['paypal-transmission-sig'][0] ?? '',
                'transmission_time' => $headers['paypal-transmission-time'][0] ?? '',
                'webhook_id' => $webhookId,
                'webhook_event' => $request->all()
            ];
            
            // Llamar a la API de PayPal para verificar la firma
            $response = Http::withToken($accessToken)
                ->post($this->getPaypalUrl() . '/v1/notifications/verify-webhook-signature', $data);
            
            $result = $response->json();
            
            // Verificar respuesta
            if ($response->successful() && isset($result['verification_status']) && $result['verification_status'] === 'SUCCESS') {
                return true;
            }
            
            Log::warning('PayPal webhook verification failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return false;
        } catch (\Exception $e) {
            Log::error('Exception verifying PayPal webhook: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * @OA\Get(
     *     path="/api/paypal/success",
     *     summary="URL de retorno para pagos exitosos",
     *     tags={"PayPal"},
     *     @OA\Response(
     *         response=200,
     *         description="Pago exitoso"
     *     )
     * )
     */
    public function success(Request $request)
    {
        Log::info('PayPal payment success', $request->all());
        return response()->json(['message' => 'Payment successful', 'data' => $request->all()]);
    }
    
    /**
     * @OA\Get(
     *     path="/api/paypal/cancel",
     *     summary="URL de retorno para pagos cancelados",
     *     tags={"PayPal"},
     *     @OA\Response(
     *         response=200,
     *         description="Pago cancelado"
     *     )
     * )
     */
    public function cancel(Request $request)
    {
        Log::info('PayPal payment cancelled', $request->all());
        return response()->json(['message' => 'Payment cancelled', 'data' => $request->all()]);
    }
}
