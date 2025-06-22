import { adminClienteDto } from './adminClienteDto';
import { adminRematadorDto } from './adminRematadorDto';
import { adminCasaRemateDto } from './adminCasaRemateDto';

export type adminUsuarioDto = adminClienteDto | adminRematadorDto | adminCasaRemateDto;