// ESM
import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFile } from "node:fs/promises";

let batch = JSON.parse(
  await readFile(new URL("./batch.json", import.meta.url), "utf8")
);

let batches = JSON.parse(
  await readFile(new URL("./batches.json", import.meta.url), "utf8")
);

let items = JSON.parse(
  await readFile(new URL("./items.json", import.meta.url), "utf8")
);
let users = JSON.parse(
  await readFile(new URL("./users.json", import.meta.url), "utf8")
);

let filters = JSON.parse(
  await readFile(new URL("./filters.json", import.meta.url), "utf8")
);

let filtersMetadata = JSON.parse(
  await readFile(new URL("./filtersMetadata.json", import.meta.url), "utf8")
);

let orders = JSON.parse(
  await readFile(new URL("./orders.json", import.meta.url), "utf8")
);

let currentBatch = 0;

const fastify = Fastify({
  logger: false,
});

await fastify.register(cors, {
  origin: "*", // or specify your desired origin
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
  exposedHeaders: ["X-Total-Rows"],
});

fastify.get("/", (request, reply) => {
  reply.send({ nm: "ariel" });
});

fastify.post("/token", (request, reply) => {
  let user = users.find((u) => u.user_id === request.body.username);
  reply.send({ token: "hello-world", is_admin: user?.is_admin || false });
});

function isBatchCompleted(batch) {
  let completed = true;

  batch.items.forEach((it) => {
    it.orders.forEach((or) => {
      if (or.units !== or.picked_units) {
        completed = false;
      }
    });
  });

  return completed;
}

fastify.get("/batch", (request, reply) => {
  if (request.query.batchId === "3423") {
    reply.status(204).send(null);
    return;
  }
  reply.send(batch);
  //reply.status(500).send({ success: false });
});
//finish batch
fastify.post("/batch", (request, reply) => {
  currentBatch = currentBatch + 1;
  reply.send({ success: true });
});

fastify.get("/batch/progress", (request, reply) => {
  reply.send({
    lines_done: 0,
    lines: 52,
    Progress: 0,
  });
});

fastify.get("/batch/all", (request, reply) => {
  setTimeout(() => {
    reply.send({
      batches,
    });
  }, 1000);
});

fastify.post("/pick", (request, reply) => {
  const body = JSON.parse(request.body);

  const { order_id, item_id, out_of_stock, picked_units } = body;
  const item = batch.items.find((it) => it.item.item_id === +item_id);

  if (!item) {
    reply.send({ success: true });
    return;
  }
  const orderToUpdate = item.orders.find((or) => or.order_id === +order_id);
  orderToUpdate.out_of_stock = out_of_stock;
  orderToUpdate.picked_units = picked_units;
  reply.send({ success: true });
});

fastify.post("/pick/multi", (request, reply) => {
  const ordersToModify = JSON.parse(request.body);

  const [{ item_id }] = ordersToModify;
  //console.log("ORDERS:", item_id);
  const item = batch.items.find((it) => it.item.item_id === +item_id);

  ordersToModify.forEach(({ order_id, picked_units }) => {
    const orderToUpdate = item.orders.find((or) => or.order_id === +order_id);
    orderToUpdate.out_of_stock = true;
    orderToUpdate.picked_units = picked_units;
  });

  reply.send({ success: true });
  //reply.status(500).send({ success: false });
});

//items
fastify.get("/items", (request, reply) => {
  setTimeout(() => {
    reply.send(items);
  }, 1000);
});

fastify.get("/orders", (request, reply) => {
  const size = +request.query.page_size;
  const page = +request.query.page;
  const startIdx = (page - 1) * size;
  setTimeout(() => {
    reply
      .header("X-Total-Rows", orders.length)
      .send(orders.slice(startIdx, startIdx + size));
  }, 100);
});

fastify.get("/items/outofstock", async (request, reply) => {
  const id = request.query.item_id;
  const out_of_stock = request.query.is_out_of_stock === "true";

  items = items.map((i) => (i.item_id === +id ? { ...i, out_of_stock } : i));

  reply.send(items);
});

//get users
fastify.get("/users", (request, reply) => {
  setTimeout(() => {
    reply.send(users);
  }, 1000);
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

fastify.get("/filter/metadata", async (request, reply) => {
  reply.send(filtersMetadata);
});

fastify.get("/filter", async (request, reply) => {
  reply.send(filters);
});

fastify.post("/filter", (request, reply) => {
  setTimeout(() => {
    reply.send({
      success: true,
    });
  }, 1000);
});

//batch/reset batchID
fastify.patch("/batch/reset", (request, reply) => {
  const batchId = request.query.batch_num;

  const batchFound = batches.find((b) => b.batch_num === +batchId);

  batchFound.pick_user = "";
  setTimeout(() => {
    reply.status(500).send({
      success: false,
    });
  }, 1000);
});

fastify.post("/sync", (request, replay) => {
  replay.send({ success: true });
});

fastify.get("/batch/sticker", (request, replay) => {
  replay.send({ success: true });
});

fastify.post("/optimize", (request, replay) => {
  replay.send({ success: true });
});

// Run the server!
fastify.listen(
  { port: process.env.PORT || 4000, host: "0.0.0.0" },
  (err, address) => {
    if (err) throw err;
    // Server is now listening on ${address}
  }
);
