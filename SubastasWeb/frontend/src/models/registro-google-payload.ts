export interface RegistroGooglePayload {
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  contrasenia: string;
  contrasenia_confirmation: string;
  rol: 'cliente' | 'rematador' | 'casa_remate';
  latitud: number;
  longitud: number;
  google_id: string;
  matricula?: string;
  idFiscal?: string;
}