import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import distributorsRoutes from "./modules/distributors/distributors.routes.js";
import customersRoutes from "./modules/customers/customers.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/distributors", distributorsRoutes);
router.use("/customers", customersRoutes);
router.use("/orders", ordersRoutes);

export default router;
