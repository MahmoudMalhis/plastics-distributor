import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import distributorsRoutes from "./modules/distributors/distributors.routes.js";

const r = Router();

r.use("/auth", authRoutes);
r.use("/categories", categoriesRoutes);
r.use("/products", productsRoutes);
r.use("/distributors", distributorsRoutes);

export default r;
