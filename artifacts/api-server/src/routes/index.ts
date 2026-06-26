import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import beatsRouter from "./beats";
import deliveriesRouter from "./deliveries";
import articlesRouter from "./articles";
import attendanceRouter from "./attendance";
import postmenRouter from "./postmen";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(beatsRouter);
router.use(deliveriesRouter);
router.use(articlesRouter);
router.use(attendanceRouter);
router.use(postmenRouter);
router.use(dashboardRouter);

export default router;
