import fs from "fs/promises";

export const handler = async (event) => {
  console.log("DB Updater received:", JSON.stringify(event));

  const detail = event.detail || JSON.parse(event.Detail);
  let db;

  try {
    db = JSON.parse(await fs.readFile("/tmp/db.json", "utf8"));
  } catch {
    db = { plans: [] };
  }

  const index = db.plans.findIndex((p) => p.id === detail.id);
  if (index > -1) {
    db.plans[index] = { ...db.plans[index], ...detail };
  } else {
    db.plans.push(detail);
  }

  await fs.writeFile("/tmp/db.json", JSON.stringify(db, null, 2));
  console.log(`✅ DB updated for plan ${detail.id}`);

  return { statusCode: 200, body: "DB updated" };
};
