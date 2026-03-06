import { Hono } from "hono";

const app = new Hono();

app.use("*", async (_c, next) => { await next(); });
app.use("*", async (_c, next) => { await next(); });
app.use("*", async (_c, next) => { await next(); });

app.get("/plaintext", (c) => c.text("Hello World!"));
app.get("/json", (c) => c.json({ message: "Hello World!" }));
app.get("/user/:id", (c) => c.json({ id: c.req.param("id") }));
app.post("/echo", async (c) => {
  const body = await c.req.json();
  return c.json(body);
});

for (let i = 0; i < 100; i++) {
  app.get(`/route-${i}`, (c) => c.text("OK"));
}

export default { port: 3000, fetch: app.fetch };
