import { Injectable } from '@angular/core';
import { loadScript } from "@paypal/paypal-js";

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  private paypal: any = null;

  constructor() {}

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
}