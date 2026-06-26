import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveriesTable, beatsTable, usersTable, activitiesTable } from "@workspace/db";
import {
  GetDeliveriesResponse,
  CreateDeliveryBody,
  CreateDeliveryResponse,
  GetDeliveryParams,
  GetDeliveryResponse,
  UpdateDeliveryParams,
  UpdateDeliveryBody,
  UpdateDeliveryResponse,
  UpdateDeliveryStatusParams,
  UpdateDeliveryStatusBody,
  UpdateDeliveryStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichDelivery(d: typeof deliveriesTable.$inferSelect) {
  const [beat] = await db.select({ name: beatsTable.name }).from(beatsTable).where(eq(beatsTable.id, d.beatId));
  const [postman] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, d.postmanId));
  return {
    ...d,
    beatName: beat?.name ?? "Unknown Beat",
    postmanName: postman?.name ?? "Unknown Postman",
    recipientPhone: d.recipientPhone ?? null,
    deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
    notes: d.notes ?? null,
  };
}

router.get("/deliveries", async (_req, res): Promise<void> => {
  const deliveries = await db.select().from(deliveriesTable).orderBy(deliveriesTable.createdAt);
  const result = await Promise.all(deliveries.map(enrichDelivery));
  res.json(GetDeliveriesResponse.parse(result));
});

router.post("/deliveries", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [delivery] = await db.insert(deliveriesTable).values({
    ...parsed.data,
    status: "pending",
  }).returning();

  await db.insert(activitiesTable).values({
    type: "delivery",
    message: `New delivery created for ${parsed.data.recipientName}`,
    userId: parsed.data.postmanId,
  });

  res.status(201).json(CreateDeliveryResponse.parse(await enrichDelivery(delivery)));
});

router.get("/deliveries/:id", async (req, res): Promise<void> => {
  const params = GetDeliveryParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  res.json(GetDeliveryResponse.parse(await enrichDelivery(delivery)));
});

router.patch("/deliveries/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [delivery] = await db.update(deliveriesTable).set(parsed.data).where(eq(deliveriesTable.id, params.data.id)).returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  res.json(UpdateDeliveryResponse.parse(await enrichDelivery(delivery)));
});

router.patch("/deliveries/:id/status", async (req, res): Promise<void> => {
  const params = UpdateDeliveryStatusParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeliveryStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "delivered") {
    updateData.deliveredAt = new Date();
  }
  if (parsed.data.notes) {
    updateData.notes = parsed.data.notes;
  }

  const [delivery] = await db.update(deliveriesTable).set(updateData).where(eq(deliveriesTable.id, params.data.id)).returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  await db.insert(activitiesTable).values({
    type: "delivery",
    message: `Delivery #${delivery.trackingNumber} status changed to ${parsed.data.status}`,
  });

  res.json(UpdateDeliveryStatusResponse.parse(await enrichDelivery(delivery)));
});

export default router;
