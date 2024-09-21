import { Hono } from "hono";
import usersRouter from "../routers/users";
import homeRouter from "../routers/home";
import { API_VERSION } from "../constants";
import authRouter from "../routers/auth";
import { jwt } from "hono/jwt";
import tagsRouter from "../routers/tags";
import categoriesRouter from "../routers/categories";
import postsRouter from "../routers/posts";

const app = new Hono().basePath("/api");

app.route(`/${API_VERSION}/auth`, authRouter);

app.use(
  `/${API_VERSION}/users/*`,
  jwt({
    secret: process.env.JWT_SECRET!,
  })
);
app.route(`/${API_VERSION}/users`, usersRouter);

app.route(`/${API_VERSION}/categories`, categoriesRouter);

app.route(`/${API_VERSION}/tags`, tagsRouter);

app.route(`/${API_VERSION}/posts`, postsRouter);

app.route("/", homeRouter);

export default app;
