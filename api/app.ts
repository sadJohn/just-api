import { Hono } from "hono";
import usersRouter from "../routers/users";
import homeRouter from "../routers/home";
import { API_VERSION } from "../constants";

const app = new Hono().basePath("/api");

app.route(`/${API_VERSION}/users`, usersRouter);

app.route("/", homeRouter);

export default app;
