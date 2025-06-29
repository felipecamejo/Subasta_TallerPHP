export interface RegistroGoogleDto {
  nombre: string;
  email: string;
  telefono: string;
  cedula: string;
  latitud: number;
  longitud: number;
  rol: 'cliente' | 'rematador' | 'casa_remate';
  google_id: string;
  matricula?: string;
  idFiscal?: string;
  imagen_url?: string;
}