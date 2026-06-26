import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, beatsTable, usersTable } from "@workspace/db";
import {
  GetBeatsResponse,
  CreateBeatBody,
  CreateBeatResponse,
  GetBeatParams,
  GetBeatResponse,
  UpdateBeatParams,
  UpdateBeatBody,
  UpdateBeatResponse,
  DeleteBeatParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function beatWithPostman(beat: typeof beatsTable.$inferSelect) {
  let assignedPostmanName: string | null = null;
  if (beat.assignedPostmanId) {
    const [postman] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, beat.assignedPostmanId));
    assignedPostmanName = postman?.name ?? null;
  }
  return {
    ...beat,
    assignedPostmanId: beat.assignedPostmanId ?? null,
    assignedPostmanName,
    latitude: beat.latitude ?? null,
    longitude: beat.longitude ?? null,
  };
}

router.get("/beats", async (_req, res): Promise<void> => {
  const beats = await db.select().from(beatsTable).orderBy(beatsTable.createdAt);
  const result = await Promise.all(beats.map(beatWithPostman));
  res.json(GetBeatsResponse.parse(result));
});

router.post("/beats", async (req, res): Promise<void> => {
  const parsed = CreateBeatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [beat] = await db.insert(beatsTable).values({
    ...parsed.data,
    status: parsed.data.status ?? "active",
    totalArticles: parsed.data.totalArticles ?? 0,
  }).returning();

  res.status(201).json(CreateBeatResponse.parse(await beatWithPostman(beat)));
});

router.get("/beats/:id", async (req, res): Promise<void> => {
  const params = GetBeatParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [beat] = await db.select().from(beatsTable).where(eq(beatsTable.id, params.data.id));
  if (!beat) {
    res.status(404).json({ error: "Beat not found" });
    return;
  }

  res.json(GetBeatResponse.parse(await beatWithPostman(beat)));
});

router.patch("/beats/:id", async (req, res): Promise<void> => {
  const params = UpdateBeatParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBeatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [beat] = await db.update(beatsTable).set(parsed.data).where(eq(beatsTable.id, params.data.id)).returning();
  if (!beat) {
    res.status(404).json({ error: "Beat not found" });
    return;
  }

  res.json(UpdateBeatResponse.parse(await beatWithPostman(beat)));
});

router.delete("/beats/:id", async (req, res): Promise<void> => {
  const params = DeleteBeatParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [beat] = await db.delete(beatsTable).where(eq(beatsTable.id, params.data.id)).returning();
  if (!beat) {
    res.status(404).json({ error: "Beat not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
