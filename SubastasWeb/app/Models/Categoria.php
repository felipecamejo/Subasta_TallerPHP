<?php
    include 'Articulo.php';

    class Categoria {
        
        private string $nombre;
        private array $categoriasPadre;
        private array $articulos;

        public function __construct(string $nombre) {
            $this->nombre = $nombre;
            $this->categorias = [];
            $this->articulos = [];
        }

        //Getters
        public function getNombre(): string {
            return $this->nombre;
        }

        public function getCategoriasPadre(): array {
            return $this->categoriasPadre;
        }

        public function getArticulos(): array {
            return $this->articulos;
        }

        //Setters
        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function setCategoriasPadre(array $categoriasPadre): void {
            $this->categoriasPadre = $categoriasPadre;
        }

        public function setArticulos(array $articulos): void {
            $this->articulos = $articulos;
        }

        public function addArticulos(Articulo $articulo): void {
            $this->articulos[] = $articulo;
        }

    }


?>