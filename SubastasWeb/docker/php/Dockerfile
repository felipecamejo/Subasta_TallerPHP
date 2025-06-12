FROM php:8.2-fpm

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev zip unzip git curl && \
    docker-php-ext-install pdo pdo_pgsql

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiar código Laravel (lo hará el volumen después)
COPY . /var/www

# Permisos (solo si hacés COPY, no necesario si usás volumen)
RUN chown -R www-data:www-data /var/www && chmod -R 755 /var/www
