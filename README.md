# web-bench

Bun web framework benchmarks. All tests run on Bun v1.2.23 using
[hey](https://github.com/rakyll/hey) with 100 concurrent connections for 10 seconds.

Frameworks tested: raw `Bun.serve` (baseline), [Hono](https://hono.dev/), [Elysia](https://elysiajs.com/), [itty-router](https://itty.dev/).

## Test Configuration

Each server registers 3 no-op middleware, 4 core routes, and 100 scaling routes (`/route-0` through `/route-99`).

All tests run with `hey -z 10s -c 100` (10 second duration, 100 concurrent connections).

- **plaintext** -- `GET /plaintext` returns a plain text response. Measures baseline framework overhead.
- **json** -- `GET /json` returns a JSON object. Measures serialization cost on top of routing.
- **params** -- `GET /user/42` matches a parameterized route `/user/:id`. Measures route param extraction.
- **body-parse** -- `POST /echo` with JSON body `{"name":"bench","value":42}`. Measures request body parsing + JSON serialization.
- **routes-100** -- `GET /route-99` hits the last of 100 registered static routes. Measures router scaling under high route count.

## Breakdown by Test

#### Plaintext -- `GET /plaintext`

```
  elysia       ████████████████████████████████████████  169,000 req/s
  bun-raw      █████████████████████████████████████░░░  156,621 req/s
  itty-router  ████████████████████████████████░░░░░░░░  137,293 req/s
  hono         ██████████████████████████████░░░░░░░░░░  129,449 req/s
```

#### JSON -- `GET /json`

```
  elysia       ████████████████████████████████████████  161,797 req/s
  bun-raw      ██████████████████████████████████████░░  154,481 req/s
  hono         ████████████████████████████░░░░░░░░░░░░  115,277 req/s
  itty-router  █████████████████████████░░░░░░░░░░░░░░░  103,012 req/s
```

#### Params -- `GET /user/:id`

```
  elysia       ████████████████████████████████████████  160,110 req/s
  bun-raw      ██████████████████████████████████████░░  153,266 req/s
  hono         ███████████████████████████░░░░░░░░░░░░░  109,699 req/s
  itty-router  ████████████████████████░░░░░░░░░░░░░░░░   99,153 req/s
```

#### Body Parse -- `POST /echo` (JSON body)

```
  bun-raw      ████████████████████████████████████████  128,293 req/s
  elysia       ████████████████████████████████████░░░░  116,923 req/s
  hono         ██████████████████████████████░░░░░░░░░░   97,324 req/s
  itty-router  █████████████████████████░░░░░░░░░░░░░░░   82,269 req/s
```

#### Routes-100 -- `GET /route-99` (100 registered routes)

```
  elysia       ████████████████████████████████████████  148,929 req/s
  bun-raw      █████████████████████████████████████░░░  141,398 req/s
  hono         ████████████████████████████████░░░░░░░░  122,455 req/s
  itty-router  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░   53,876 req/s
```

## Summary

Elysia wins 4 out of 5 tests. The only loss is body-parse, where raw `Bun.serve` takes the lead by 10%

Key observations:
- Routing algorithm is critical. itty-router's linear scan collapses to 54k req/s at 100 routes (-64% vs elysia). Hono's compiled regex and elysia's radix tree both maintain near-constant performance.
- Body parsing is the most expensive operation across all frameworks (20-40% drop from plaintext). Lazy parsing (only when accessed) is the main optimization opportunity.
- Middleware overhead becomes visible when request body parsing is involved.
- JSON serialization adds 4-11% overhead depending on the framework. Response construction matters.

```
elysia
  |
  plaintext    ████████████████████████████████████████  169,000 req/s
  |- vs bun-raw    (+7.9%)                              156,621 req/s
  |- vs itty-router (+23.1%)                            137,293 req/s
  '- vs hono       (+30.6%)                             129,449 req/s

  json         ███████████████████████████████████████░  161,797 req/s
  |- vs bun-raw    (+4.7%)                              154,481 req/s
  |- vs hono       (+40.4%)                             115,277 req/s
  '- vs itty-router (+57.1%)                            103,012 req/s

  params       ██████████████████████████████████████░░  160,110 req/s
  |- vs bun-raw    (+4.5%)                              153,266 req/s
  |- vs hono       (+45.9%)                             109,699 req/s
  '- vs itty-router (+61.5%)                             99,153 req/s

  body-parse   ███████████████████████████░░░░░░░░░░░░░  116,923 req/s
  |- vs bun-raw    (-8.9%)                              128,293 req/s
  |- vs hono       (+20.1%)                              97,324 req/s
  '- vs itty-router (+42.1%)                             82,269 req/s

  routes-100   ██████████████████████████████████░░░░░░  148,929 req/s
  |- vs bun-raw    (+5.3%)                              141,398 req/s
  |- vs hono       (+21.6%)                             122,455 req/s
  '- vs itty-router (+176.4%)                            53,876 req/s
```

## Setup

```bash
bun install
```

Start a server:

```bash
bun run hono
bun run elysia
bun run itty
bun run bun-raw
```

Run benchmarks (server must be running):

```bash
./bench.sh <framework>
```
