// ESM
import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFile } from "node:fs/promises";

let batch = JSON.parse(
  await readFile(new URL("./batch.json", import.meta.url), "utf8")
);
let items = JSON.parse(
  await readFile(new URL("./items.json", import.meta.url), "utf8")
);
let users = JSON.parse(
  await readFile(new URL("./users.json", import.meta.url), "utf8")
);
/*
import batch from './batch.json' assert {type: 'json'}; 
import items from './items.json' assert {type: 'json'}; 
import users from './users.json' assert {type: 'json'}; 
*/
let currentBatch = 0;

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: "*", // or specify your desired origin
  methods: ["GET", "PUT", "POST", "DELETE"],
});

fastify.get("/", (request, reply) => {
  reply.send({ nm: "ariel" });
});

fastify.post("/token", (request, reply) => {
  setTimeout(() => {
    reply.send({ token: "hello-world", is_admin: true });
  }, 2000);
});

fastify.get("/batch", (request, reply) => {
  console.log("CURRENT BATCH:", currentBatch);
  if (currentBatch < 1) {
    reply.send(batch);
  } else {
    reply.status(500).send({ message: "no more batches" });
  }
});

fastify.patch("/batch/reset", (request, reply) => {
  reply.send({ success: true });
});

fastify.post("/pick", (request, reply) => {
  reply.send({ success: true });
});

//finish batch
fastify.post("/batch", (request, reply) => {
  currentBatch = currentBatch + 1;

  reply.send({ success: true });
});

fastify.get("batch/progress", (request, reply) => {
  reply.send({
    lines_done: 0,
    lines: 52,
    Progress: 0,
  });
});

//items
fastify.get("/items", async (request, reply) => {
  reply.send(items);
});

fastify.get("/items/outofstock", async (request, reply) => {
  const id = request.query.item_id;
  const out_of_stock = request.query.is_out_of_stock === "true";
  console.log("out_of_stock:::", out_of_stock, id);
  items = items.map((i) => (i.item_id === +id ? { ...i, out_of_stock } : i));
  console.log("KKK:", items[0]);
  reply.send(items);
});

//get users
fastify.get("/users", async (request, reply) => {
  reply.send(users);
});

//create user
fastify.post("/users", async (request, reply) => {
  const user = request.body;
  user.id = new Date().getTime();
  reply.send(user);
});

//delete user
fastify.delete("/user", (request, reply) => {
  users = users.filter((u) => u.user_id !== request.query.user_id);
  reply.send({ success: true });
});
// Run the server!
fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  // Server is now listening on ${address}
});