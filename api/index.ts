import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

export const config = {
  runtime: "edge",
};

app.get("/", (c) => {
  return c.json({ message: "Congrats! You've deployed Hono to Vercel" });
});

const server = process.env.MODE === "pro" ? handle(app) : app;

export default server;
