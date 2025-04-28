<?php
    class Articulo {
        private array $imagenes;
        private string $especifiacacion;
        private bool $disponibilidad;
        private string $condicion;
        private Vendedor $vendedor;
        private array $categorias;

        function __construct(array $imagenes, string  $especifiacacion, bool $disponibilidad, string $condicion, Vendedor $vendedor, Categoria $categorias) {
            $this->imagenes = $imagenes;
            $this->especifiacacion = $especifiacacion;
            $this->disponibilidad = $disponibilidad;
            $this->condicion = $condicion;
            $this->vendedor = $vendedor;
            $this->categorias = $categorias;
        }

        // Getters
        public function getImagenes(): array{
            return $this->imagenes;
        }

        public function getEspecifiacacion(): string {
            return $this->especifiacacion;
        }

        public function getDisponibilidad(): bool {
            return $this->disponibilidad;
        }

        public function getCondicion(): string {
            return $this->condicion;
        }

        public function getVendedor(): Vendedor {
            return $this->vendedor;
        }

        public function getCategorias(): Categoria {
            return $this->categorias;
        }

        // Setters
        public function setImagenes(array $imagenes): void {
            $this->imagenes = $imagenes;
        }

        public function setEspecifiacacion(string $especifiacacion): void {
            $this->especifiacacion = $especifiacacion;
        }

        public function setDisponibilidad(bool $disponibilidad): void {
            $this->disponibilidad = $disponibilidad;
        }

        public function setCondicion(string $condicion): void {
            $this->condicion = $condicion;
        }

        public function setVendedor(Vendedor $vendedor): void {
            $this->vendedor = $vendedor;
        }

        public function setCategorias(Categoria $categorias): void {
            $this->categorias = $categorias;
        }
    
    }
?>