import { Pipe, PipeTransform } from '@angular/core';
import { TimezoneService } from '../../../services/timezone.service';

@Pipe({
  name: 'userTimezone',
  standalone: true
})
export class UserTimezonePipe implements PipeTransform {
  constructor(private timezoneService: TimezoneService) {}

  transform(value: Date | string, format: string = 'datetime'): string {
    if (!value) {
      return '';
    }

    return this.timezoneService.formatDate(value, format);
  }
}
