import { Hono } from "hono";
import usersRouter from "../routers/users";
import homeRouter from "../routers/home";
import { API_VERSION } from "../constants";
import authRouter from "../routers/auth";
import { jwt } from "hono/jwt";

const app = new Hono().basePath("/api");

app.route(`/${API_VERSION}/auth`, authRouter);

app.use(
  `/${API_VERSION}/users`,
  jwt({
    secret: process.env.JWT_SECRET!,
  })
);

app.route(`/${API_VERSION}/users`, usersRouter);

app.route("/", homeRouter);

export default app;
