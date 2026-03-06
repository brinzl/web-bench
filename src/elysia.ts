import { Elysia } from "elysia";

const app = new Elysia();

app.get("/plaintext", () => "Hello World!");
app.get("/json", () => ({ message: "Hello World!" }));
app.get("/user/:id", ({ params }) => ({ id: params.id }));
app.post("/echo", ({ body }) => body);

app.onRequest(() => {});  // middleware 1
app.onRequest(() => {});  // middleware 2
app.onRequest(() => {});  // middleware 3

for (let i = 0; i < 100; i++) {
  app.get(`/route-${i}`, () => "OK");
}

app.listen(3000);
