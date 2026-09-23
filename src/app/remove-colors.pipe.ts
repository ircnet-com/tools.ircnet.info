import { Pipe, PipeTransform } from '@angular/core';
import { RemoveColorsService } from "./remove-colors.service";

@Pipe({
  name: 'removeColors',
  standalone: true
})
export class RemoveColorsPipe implements PipeTransform {
  constructor(private removeColorsService: RemoveColorsService) {
  }

  transform(text: any): any {
    this.removeColorsService.transform(text);
  }
}
