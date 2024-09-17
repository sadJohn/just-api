import { Hono } from "hono";
import usersRouter from "@/routers/users";
import homeRouter from "@/routers/home";

const app = new Hono().basePath("/api");

app.route("/users", usersRouter);

app.route("/", homeRouter);

export default app;
