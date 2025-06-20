import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { PaypalService } from '../../services/Paypal.service';

@Component({
  selector: 'app-paypal',
  template: '<div #paypalButton></div>',
  styleUrls: ['./pay-pal.component.scss']
})
export class PayPalComponent implements OnInit {
  @Input() amount!: number;
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<any>();
  @ViewChild('paypalButton') paypalButton!: ElementRef;

  constructor(private paypalService: PaypalService) {}

  async ngOnInit() {
    try {
      const paypal = await this.paypalService.initializePayPal();
      
      await paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.amount.toString(),
                currency_code: 'USD'
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          console.log('Payment completed', order);
          this.paymentSuccess.emit({
            orderId: order.id,
            amount: this.amount,
            details: order
          });
        },
        onError: (err: any) => {
          console.error('PayPal Error:', err);
          this.paymentError.emit(err);
        }
      }).render(this.paypalButton.nativeElement);
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
    }
  }
}
