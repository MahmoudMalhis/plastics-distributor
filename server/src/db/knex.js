import knexInit from "knex";
import config from "../../knexfile.js";

const env = process.env.NODE_ENV || "development";
const knex = knexInit(config[env]);

export default knex;
