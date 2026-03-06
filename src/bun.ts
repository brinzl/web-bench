const scaleRoutes = new Map<string, string>();
for (let i = 0; i < 100; i++) {
  scaleRoutes.set(`/route-${i}`, "OK");
}

function middleware1(req: Request, next: () => Response | Promise<Response>) { return next(); }
function middleware2(req: Request, next: () => Response | Promise<Response>) { return next(); }
function middleware3(req: Request, next: () => Response | Promise<Response>) { return next(); }

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/plaintext") {
    return new Response("Hello World!", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (path === "/json") {
    return Response.json({ message: "Hello World!" });
  }

  if (path.startsWith("/user/")) {
    const id = path.slice(6);
    return Response.json({ id });
  }

  if (req.method === "POST" && path === "/echo") {
    const body = await req.json();
    return Response.json(body);
  }

  const body = scaleRoutes.get(path);
  if (body) {
    return new Response(body, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

Bun.serve({
  port: 3000,
  fetch(req) {
    return middleware1(req, () =>
      middleware2(req, () =>
        middleware3(req, () => handler(req))
      )
    );
  },
});
