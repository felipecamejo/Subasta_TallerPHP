export interface PaginacionRespuesta<T> {
  data: T[];
  current_page: number;
  last_page: number;
  links: any[];
}