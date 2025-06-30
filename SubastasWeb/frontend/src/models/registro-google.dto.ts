export interface RegistroGoogleDto {
  nombre: string;
  email: string;
  telefono: string;
  cedula: string | null; 
  contrasenia: string;
  contrasenia_confirmation: string;
  rol: 'cliente' | 'rematador' | 'casa_remate';
  matricula?: string | null; 
  idFiscal?: string | null; 
  longitud: number;
  google_id: string;
}