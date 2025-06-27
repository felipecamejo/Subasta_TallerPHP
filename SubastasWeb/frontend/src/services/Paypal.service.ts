import { Injectable } from '@angular/core';
import { loadScript, PayPalScriptOptions } from "@paypal/paypal-js";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  private paypal: any = null;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async initializePayPal() {
    try {
      if (this.paypal) {
        return this.paypal;
      }

      this.paypal = await loadScript({ 
        clientId: "AZpt3wDVYu1SOUkbE0V_OZvXq7n1DqwFry0sYeRkAlRyf3yhhXJ5HTrJpNuL6qEA_6KKZpSRiKwNl9a7",
        currency: "USD",
        intent: "capture"
      });
      
      return this.paypal;
    } catch (error) {
      console.error('Error initializing PayPal:', error);
      throw error;
    }
  }

  /**
   * Crea una orden de pago a través del backend
   * @param facturaId ID de la factura a pagar
   * @param amount Monto a pagar
   * @returns Observable con la respuesta de la API
   */
  createOrder(facturaId: number, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/paypal/create-order`, {
      factura_id: facturaId,
      amount: amount
    });
  }

  /**
   * Captura un pago a través del backend
   * @param orderId ID de la orden de PayPal
   * @returns Observable con la respuesta de la API
   */
  capturePayment(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/paypal/capture-payment`, {
      order_id: orderId
    });
  }
}