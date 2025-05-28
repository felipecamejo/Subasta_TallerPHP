import { rematadorDto } from './rematadorDto';
import { clienteDto } from './clienteDto';

export interface usuarioDto {
    id: number;
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
    imagen: string;
    contrasenia: string;
    latitud: number;
    longitud: number;
    
    rematador: Pick<rematadorDto, 'usuario'>;
    cliente: Pick<clienteDto, 'usuario'>;

}
