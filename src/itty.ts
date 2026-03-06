import { AutoRouter, Router } from "itty-router";

const router = Router({
  before: [
    () => {},  // middleware 1
    () => {},  // middleware 2
    () => {},  // middleware 3
  ],
})
  
router.get("/plaintext", () => new Response("Hello World!", {
  headers: { "Content-Type": "text/plain" },
}));

router.get("/json", () => ({ message: "Hello World!" }));
router.get("/user/:id", ({ params }) => ({ id: params.id }));
router.post("/echo", async (req) => {
  const body = await req.json();
  return body;
});

for (let i = 0; i < 100; i++) {
  router.get(`/route-${i}`, () => "OK");
}

Bun.serve({
  port: 3000,
  fetch: router.fetch,
});