import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, postmanLocationsTable, usersTable, beatsTable } from "@workspace/db";
import {
  GetPostmenLocationsResponse,
  UpdatePostmanLocationParams,
  UpdatePostmanLocationBody,
  UpdatePostmanLocationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichLocation(loc: typeof postmanLocationsTable.$inferSelect) {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, loc.userId));
  let beatName: string | null = null;
  if (loc.beatId) {
    const [beat] = await db.select({ name: beatsTable.name }).from(beatsTable).where(eq(beatsTable.id, loc.beatId));
    beatName = beat?.name ?? null;
  }
  return {
    ...loc,
    userName: user?.name ?? "Unknown",
    beatId: loc.beatId ?? null,
    beatName,
  };
}

router.get("/postmen", async (_req, res): Promise<void> => {
  const locations = await db.select().from(postmanLocationsTable);
  const result = await Promise.all(locations.map(enrichLocation));
  res.json(GetPostmenLocationsResponse.parse(result));
});

router.patch("/postmen/:id/location", async (req, res): Promise<void> => {
  const params = UpdatePostmanLocationParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePostmanLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    lastUpdated: new Date(),
  };
  if (parsed.data.isOnDuty !== undefined) {
    updateData.isOnDuty = parsed.data.isOnDuty;
  }

  const [loc] = await db.update(postmanLocationsTable)
    .set(updateData)
    .where(eq(postmanLocationsTable.id, params.data.id))
    .returning();

  if (!loc) {
    res.status(404).json({ error: "Postman location not found" });
    return;
  }

  res.json(UpdatePostmanLocationResponse.parse(await enrichLocation(loc)));
});

export default router;
