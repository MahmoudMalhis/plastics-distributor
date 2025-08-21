import dotenv from "dotenv";
dotenv.config();
export default {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
    },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },
};
