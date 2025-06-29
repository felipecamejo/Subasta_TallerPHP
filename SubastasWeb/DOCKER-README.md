# Aplicación de Subastas - Configuración Docker

Esta aplicación consiste en múltiples servicios que se ejecutan en contenedores Docker:

- **Laravel** (Backend API) - Puerto 80 vía Nginx
- **Angular** (Frontend) - Puerto 4200  
- **WebSocket Server** (Tiempo real) - Puerto 3001
- **Socket Redis Server** (Colas) - Puerto 3000
- **PostgreSQL** (Base de datos) - Puerto 5432
- **Redis** (Cache y colas) - Puerto 6379
- **Nginx** (Servidor web) - Puerto 80

## Prerrequisitos

- Docker y Docker Compose instalados
- Puertos 80, 4200, 3001, 3000, 5432, 6379 libres

## Configuración inicial

1. **Copiar el archivo de entorno:**
   ```bash
   cp .env.example .env
   ```

2. **Verificar configuración en .env:**
   - `DB_HOST=db`
   - `DB_DATABASE=laravel`
   - `DB_USERNAME=user`
   - `DB_PASSWORD=password`
   - `REDIS_HOST=redis`
   - `QUEUE_CONNECTION=redis`

## Levantar la aplicación

### Opción 1: Todo junto
```bash
docker-compose up -d
```

### Opción 2: Paso a paso (recomendado para primera vez)

1. **Levantar base de datos y Redis:**
   ```bash
   docker-compose up -d db redis
   ```

2. **Esperar unos segundos y levantar Laravel:**
   ```bash
   docker-compose up -d app
   ```

3. **Levantar Nginx:**
   ```bash
   docker-compose up -d nginx
   ```

4. **Levantar los servicios WebSocket:**
   ```bash
   docker-compose up -d websocket socket-redis
   ```

5. **Levantar el frontend:**
   ```bash
   docker-compose up -d frontend
   ```

6. **Levantar las colas de Laravel:**
   ```bash
   docker-compose up -d queue
   ```

## Verificar que todo funciona

- **Frontend Angular:** http://localhost:4200
- **Backend Laravel:** http://localhost
- **WebSocket:** ws://localhost:3001
- **Socket Redis:** ws://localhost:3000

## Ver logs

```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f frontend
docker-compose logs -f websocket
```

## Comandos útiles

```bash
# Parar todos los servicios
docker-compose down

# Reconstruir imágenes
docker-compose build

# Ejecutar comandos en el contenedor de Laravel
docker-compose exec app php artisan migrate
docker-compose exec app php artisan tinker

# Instalar dependencias del frontend
docker-compose exec frontend npm install

# Acceder al shell de un contenedor
docker-compose exec app bash
docker-compose exec frontend sh
```

## Troubleshooting

### Error de permisos en Laravel
```bash
docker-compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker-compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
```

### Problemas de conexión WebSocket
- Verificar que los puertos 3001 y 3000 estén libres
- Revisar los logs: `docker-compose logs websocket`

### Base de datos no se conecta
- Esperar más tiempo a que PostgreSQL termine de inicializar
- Verificar logs: `docker-compose logs db`

### Frontend no se conecta al backend
- Verificar que Angular esté configurado para `http://localhost` (no 127.0.0.1)
- Revisar configuración de CORS en Laravel

## Arquitectura de servicios

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Angular   │────│    Nginx    │────│   Laravel   │
│  (Puerto    │    │  (Puerto    │    │  (Puerto    │
│   4200)     │    │    80)      │    │   9000)     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                                      │
       │            ┌─────────────┐          │
       └────────────│  WebSocket  │──────────┘
                    │  (Puerto    │
                    │   3001)     │
                    └─────────────┘
                           │
                    ┌─────────────┐    ┌─────────────┐
                    │Socket Redis │    │    Redis    │
                    │  (Puerto    │────│  (Puerto    │
                    │   3000)     │    │   6379)     │
                    └─────────────┘    └─────────────┘
                                             │
                                      ┌─────────────┐
                                      │ PostgreSQL  │
                                      │  (Puerto    │
                                      │   5432)     │
                                      └─────────────┘
```

## Próximos pasos (opcional)

1. **Integrar Redis para colas de pujas:** El socket-redis-server está preparado para manejar eventos de Redis
2. **Configurar notificaciones en tiempo real:** Usar Redis pub/sub para eventos entre Laravel y WebSocket
3. **Balanceador de carga:** Para producción, agregar múltiples instancias de cada servicio
