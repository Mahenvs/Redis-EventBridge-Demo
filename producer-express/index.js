import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";
import fs from "fs/promises";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

dotenv.config();

const app = express();
app.use(express.json());

const client = createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));
await client.connect();

// EventBridge Client
const ebClient = new EventBridgeClient({ region: process.env.AWS_REGION });


// Helper to read db.json
async function readDB() {
  const data = await fs.readFile("db.json", "utf8");
  return JSON.parse(data);
}

// Helper to write db.json
async function writeDB(data) {
  await fs.writeFile("db.json", JSON.stringify(data, null, 2));
}

app.get("/test",async(req,res) =>{
      
  res.send({ message: "Test Route Working success" });
})
// Get all plans (with Redis cache)
app.get("/plans", async (req, res) => {
  try {
    const cached = await client.get("plans");
    if (cached) return res.send(JSON.parse(cached));

    const db = await readDB();
    await client.set("plans", JSON.stringify(db.plans));
    res.send(db.plans);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Get plan by ID (check Redis first)
app.get("/plans/:id", async (req, res) => {
  try {
    const cached = await client.get("plans");
    let plans;

    if (cached) {
      plans = JSON.parse(cached);
    } else {
      const db = await readDB();
      plans = db.plans;
      await client.set("plans", JSON.stringify(plans));
    }

    const plan = plans.find((p) => p.id === req.params.id);
    if (!plan) return res.status(404).send("Plan not found");

    res.send(plan);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Update  plan with EventBridgge
app.post("/updatePlan", async (req, res) => {
  try {
    const newPlan = req.body;
    if (!newPlan.id) return res.status(400).send("Plan must have an id");

    // 1. Publish event instead of directly updating DB/Redis
    const event = {
      Source: "catalog.api",
      DetailType: "PlanPriceUpdated",
      Detail: JSON.stringify(newPlan),
      EventBusName: process.env.EVENT_BUS_NAME
    };

    const data= await ebClient.send(new PutEventsCommand({ Entries: [event] }));
    console.log(data);
    
    res.send({ message: "Plan update event published", plan: newPlan });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/cache", async (req, res) => {
  try {
    console.log(" I a m in cache : Updating elasticCache");
    
    const db = await readDB();
    await client.set("plans", JSON.stringify(db.plans));

    res.send({ message: "Key added", key, value });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error writing to cache");
  }
});

// Update or add a plan (update DB + Redis)
// app.post("/updatePlan", async (req, res) => {
//   try {
//     const newPlan = req.body;
//     if (!newPlan.id) return res.status(400).send("Plan must have an id");

//     const db = await readDB();
//     const index = db.plans.findIndex((p) => p.id === newPlan.id);

//     if (index > -1) {
//       db.plans[index] = { ...db.plans[index], ...newPlan };
//     } else {
//       db.plans.push(newPlan);
//     }

//     // Save to DB
//     await writeDB(db);

//     // Update Redis cache
//     await client.set("plans", JSON.stringify(db.plans));

//     res.send({ message: "Plan updated", plan: newPlan });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => 
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);