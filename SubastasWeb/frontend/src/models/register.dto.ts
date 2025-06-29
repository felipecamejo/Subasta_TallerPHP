export interface RegisterUsuarioDto {
  nombre: string;
  email: string;
  telefono: string;
  cedula?: string;
  contrasenia: string;
  contrasenia_confirmation: string;
  latitud: number;
  longitud: number;
  rol: 'cliente' | 'rematador' | 'casa_remate';
  matricula?: string;
  imagen?: File; // opcional
}
