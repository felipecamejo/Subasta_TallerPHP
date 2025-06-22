export interface RegistroPayload {
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  contrasenia: string;
  contrasenia_confirmation: string;
  rol: 'cliente' | 'rematador' | 'casa_remate';
  matricula?: string;
  idFiscal?: string;
  latitud: number;
  longitud: number;
}
