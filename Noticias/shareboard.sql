-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:8889
-- Tiempo de generación: 03-04-2025 a las 23:54:51
-- Versión del servidor: 8.0.40
-- Versión de PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `shareboard`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shares`
--

CREATE TABLE `shares` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `link` varchar(255) NOT NULL,
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `shares`
--

INSERT INTO `shares` (`id`, `user_id`, `title`, `body`, `link`, `create_date`) VALUES
(15, 1, 'Ultimas noticias de UTEC', 'Se comparte el portal de las últimas noticias de UTEC.', 'https://utec.edu.uy/es/noticias/', '2025-04-03 21:04:25'),
(16, 1, 'Montevideo Portal', 'Un portal muy interesante sobre las noticias más recientes de Montevideo.', 'https://www.montevideo.com.uy', '2025-04-03 21:37:46'),
(17, 1, 'Noticia de UdelaR', 'Se realizaron varias amenazas en UdelaR...', 'https://www.elobservador.com.uy/ciencia-y-tecnologia/hackers-filtran-informacion-docentes-y-udelar-responde-investigacion-n5992553', '2025-04-03 22:57:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `register_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `register_date`) VALUES
(19, 'Nico', 'nicolas.escobar@utec.edu.uy', 'deb97a759ee7b8ba42e02dddf2b412fe', '2020-04-03 22:41:37'),
(20, 'Maria', 'maria@mail.com', '$2y$10$4VIag4ETgbJBhUdUgoqyO.m/pfA8XeBCL7pgnAdihKjg8JXQ3ob0C', '2025-04-03 21:02:06'),
(21, 'Pepe', 'pepe@mail.com', '$2y$10$b5UyMvMUC3ZoXrppk/0BfeC3HFUcrRYf/eQKgxKsXvoL9ujQsdNb6', '2025-04-03 21:08:45'),
(22, 'Admin', 'admin@mail.com', '$2y$10$8FFtItAaOY77cTnr5vGeDuewFozdy0lvQWZDqkxV.seJKq3HdvsGm', '2025-04-03 21:10:44');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `shares`
--
ALTER TABLE `shares`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `shares`
--
ALTER TABLE `shares`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
