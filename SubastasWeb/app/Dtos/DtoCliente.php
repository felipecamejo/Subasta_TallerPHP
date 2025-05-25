<?php

namespace App\DTOs;

use App\DTOs\DtoUsuario;

class DtoCliente{
    public $usuario_id;
    public $calificacion;
    public $usuario;

    /** @var DtoPuja[] */
    public array $pujas;

    /** @var DtoNotificacion[] */
    public array $notificaciones;

    public function __construct($usuario_id, $calificacion, $pujas, $usuario, $notificaciones){ 
        $this->usuario_id = $usuario_id;
        $this->usuario = $usuario;
        $this->calificacion = $calificacion;
        $this->pujas = $pujas;
        $this->notificaciones = $notificaciones;
    }

    public function toArray(): array {
        return [
            'usuario_id' => $this->usuario_id,
            'usuario' => $this->usuario,
            'calificacion' => $this->calificacion,
            'pujas' => array_map(function($puja) {
                return $puja->toArray();
            }, $this->pujas),
            'notificaciones' => array_map(function($notificacion) {
                return $notificacion->toArray();
            }, $this->notificaciones)
        ];
    }
}