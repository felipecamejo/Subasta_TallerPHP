import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { PaypalService } from '../../services/Paypal.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paypal',
  template: `
    <div #paypalButton></div>
    <div *ngIf="loading" class="loading-spinner">
      <div class="spinner"></div>
      <div class="message">Procesando pago...</div>
    </div>
    <div *ngIf="error" class="error-message">{{ error }}</div>
  `,
  styleUrls: ['./pay-pal.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class PayPalComponent implements OnInit {
  @Input() amount!: number;
  @Input() facturaId!: number;
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<any>();
  @ViewChild('paypalButton') paypalButton!: ElementRef;
  
  loading = false;
  error: string | null = null;

  constructor(private paypalService: PaypalService) {}

  async ngOnInit() {
    try {
      const paypal = await this.paypalService.initializePayPal();
      await paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          this.loading = true;
          this.error = null;
          // Crear orden directamente en el frontend
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: this.amount.toString(),
                  currency_code: 'USD'
                }
              }
            ]
          });
        },
        onApprove: (data: any, actions: any) => {
          this.loading = true;
          this.error = null;
          // Capturar pago directamente en el frontend
          return actions.order.capture().then((details: any) => {
            this.loading = false;
            this.paymentSuccess.emit({
              orderId: data.orderID,
              amount: this.amount,
              details: details
            });
          }).catch((err: any) => {
            this.loading = false;
            this.error = 'Error al procesar el pago';
            this.paymentError.emit(err);
          });
        },
        onError: (err: any) => {
          console.error('PayPal Error:', err);
          this.loading = false;
          this.error = 'Error en el proceso de pago';
          this.paymentError.emit(err);
        },
        onCancel: () => {
          console.log('Payment cancelled');
          this.loading = false;
          this.error = 'Pago cancelado';
        }
      }).render(this.paypalButton.nativeElement);
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
      this.error = 'Error al inicializar PayPal';
    }
  }
}
