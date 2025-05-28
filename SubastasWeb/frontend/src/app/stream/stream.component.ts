import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FooterComponent } from '../footer/footer.component';
import { SubastaService } from '../../services/subasta.service';
import { subastaDto } from '../../models/subastaDto';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [InputTextModule, FormsModule, ButtonModule, FooterComponent],
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent {
  timer: string = '2:47';
  value: string = '';

  constructor() {
    subastaService: SubastaService;
  }

  subastaDto: subastaDto;

  subastaDto = subastaService.getSubasta(3);
}
