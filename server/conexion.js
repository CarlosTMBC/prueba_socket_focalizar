require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const { Pool } = require('pg'); // Importa el Pool de PostgreSQL para gestionar las conexiones

// Configuración de la conexión a la base de datos
/* 
Configuración de la conexión a la base de datos PostgreSQL.
Se utiliza un pool de conexiones y las credenciales se obtienen desde el archivo .env.
Esto permite mantener la seguridad y flexibilidad del entorno.
*/
const pool = new Pool({
  user: process.env.DB_USERNAME, // Usuario de la base de datos
  host: process.env.DB_HOST, // Dirección del servidor (ej. localhost o IP)
  database: process.env.DB_DATABASE, // Nombre de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña del usuario
  port: process.env.DB_PORT,   // Puerto de conexión (5432 por defecto en PostgreSQL)
});

// Conectar a la base de datos
pool.connect()
  .then(() => console.log('Conectado a PostgreSQL')) // Éxito al conectar
  .catch(err => console.error('Error de conexión', err)); // Manejo de errores al conectar

/* 
Exporta solo el método query del pool.
Esto permite ejecutar consultas SQL en cualquier parte del sistema de forma reutilizable.
*/
module.exports = {
  query: (text, params) => pool.query(text, params)
};