export interface adminBaseUsuarioDto {
  usuario_id: number;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    imagen: string;
  };
}
