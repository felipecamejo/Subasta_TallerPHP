import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  items: MenuItem[] = [
    { label: 'Home', routerLink: ['/'] },
    { label: 'Categories', routerLink: ['/categories'] },
    { label: 'Authors', routerLink: ['/authors'] },
    { label: 'Shop', routerLink: ['/shop'] },
    { label: 'Contact', routerLink: ['/contact'] }
  ];
}