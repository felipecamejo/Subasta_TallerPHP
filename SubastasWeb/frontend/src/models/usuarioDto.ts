import { rematadorDto } from './rematadorDto';
import { clienteDto } from './clienteDto';
import { casaRemateDto } from './casaRemateDto';

export interface usuarioDto {
    id: number | null;
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
    imagen: string;
    contrasenia: string;
    latitud: number;
    longitud: number;

    rematador?: Pick<rematadorDto, 'usuario'>;
    cliente?: Pick<clienteDto, 'usuario'>;
    casaremate?: Pick<casaRemateDto, 'usuario'>;
}
