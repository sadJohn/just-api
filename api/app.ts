import { Hono } from "hono";
import usersRouter from "../routers/users";

const app = new Hono().basePath("/api");

app.route("/users", usersRouter);

export default app;
