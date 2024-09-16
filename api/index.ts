import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getUsers } from "../db/queries/select";

const app = new Hono().basePath("/api");

export const config = {
  runtime: "edge",
};

app.get("/", async (c) => {
  const users = await getUsers();
  return c.json(users);
});

const server = process.env.MODE === "pro" ? handle(app) : app;

export default server;
