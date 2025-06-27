import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { PaypalService } from '../../services/Paypal.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
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
          
          // Crear orden a través del backend
          return new Promise((resolve, reject) => {
            this.paypalService.createOrder(this.facturaId, this.amount)
              .pipe(
                catchError(err => {
                  console.error('Error creating order:', err);
                  this.error = 'Error al crear la orden de pago';
                  this.loading = false;
                  this.paymentError.emit(err);
                  reject(err);
                  return throwError(() => err);
                })
              )
              .subscribe(response => {
                this.loading = false;
                if (response && response.id) {
                  resolve(response.id);
                } else {
                  this.error = 'La respuesta del servidor no contiene un ID de orden válido';
                  reject(new Error('Invalid order ID'));
                }
              });
          });
        },
        onApprove: (data: any, actions: any) => {
          this.loading = true;
          this.error = null;
          
          // Capturar pago a través del backend
          return new Promise((resolve, reject) => {
            this.paypalService.capturePayment(data.orderID)
              .pipe(
                catchError(err => {
                  console.error('Error capturing payment:', err);
                  this.error = 'Error al procesar el pago';
                  this.loading = false;
                  this.paymentError.emit(err);
                  reject(err);
                  return throwError(() => err);
                })
              )
              .subscribe(response => {
                this.loading = false;
                if (response && response.success) {
                  this.paymentSuccess.emit({
                    orderId: data.orderID,
                    amount: this.amount,
                    details: response.data
                  });
                  resolve(response.data);
                } else {
                  this.error = 'Error al procesar el pago';
                  this.paymentError.emit(response);
                  reject(new Error('Payment capture failed'));
                }
              });
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
