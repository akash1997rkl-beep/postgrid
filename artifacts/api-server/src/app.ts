import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Option: If you need custom serializers, use this pattern
app.use(
  pinoHttp({
    logger,
    transport: {
      target: "pino-http-print",
      options: {
        translateTime: true,
        colorize: true,
        destination: 1,
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
