import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminProxyRouter from "./adminProxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminProxyRouter);

export default router;
