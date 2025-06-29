FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        zip \
        gd

# Instalar Redis extension para PHP
RUN pecl install redis && docker-php-ext-enable redis

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiar script de entrada
COPY docker/php/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Crear usuario www-data si no existe y dar permisos
RUN usermod -u 1000 www-data || useradd -u 1000 www-data
RUN chown -R www-data:www-data /var/www

# Exponer puerto 9000 para PHP-FPM
EXPOSE 9000

# Usar el script de entrada
ENTRYPOINT ["docker-entrypoint.sh"]

# Ejecutar PHP-FPM
CMD ["php-fpm"]
