import { handler } from "./index.js";

const event = {
  "detail-type": "PlanPriceUpdated",
  "source": "catalog.api",
  "detail": {
    "id": "plan:105",
    "price": 299
  }
};

handler(event)
  .then((res) => console.log("Result:", res))
  .catch((err) => console.error("Error:", err));
