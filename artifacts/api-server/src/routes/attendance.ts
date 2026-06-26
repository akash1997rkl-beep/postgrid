import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, attendanceTable, usersTable, activitiesTable } from "@workspace/db";
import {
  GetAttendanceResponse,
  GetTodayAttendanceResponse,
  CheckInBody,
  CheckInResponse,
  CheckOutParams,
  CheckOutResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function enrichAttendance(a: typeof attendanceTable.$inferSelect) {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.userId));
  return {
    ...a,
    userName: user?.name ?? "Unknown User",
    checkOutTime: a.checkOutTime ? a.checkOutTime.toISOString() : null,
    notes: a.notes ?? null,
  };
}

router.get("/attendance", async (_req, res): Promise<void> => {
  const records = await db.select().from(attendanceTable).orderBy(sql`${attendanceTable.checkInTime} DESC`);
  const result = await Promise.all(records.map(enrichAttendance));
  res.json(GetAttendanceResponse.parse(result));
});

router.get("/attendance/today", async (_req, res): Promise<void> => {
  const today = getTodayDate();
  const records = await db.select().from(attendanceTable).where(eq(attendanceTable.date, today));
  const result = await Promise.all(records.map(enrichAttendance));
  res.json(GetTodayAttendanceResponse.parse(result));
});

router.post("/attendance/checkin", async (req, res): Promise<void> => {
  const parsed = CheckInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = getTodayDate();
  const [record] = await db.insert(attendanceTable).values({
    userId: parsed.data.userId,
    date: today,
    status: "present",
    notes: parsed.data.notes ?? null,
  }).returning();

  await db.insert(activitiesTable).values({
    type: "attendance",
    message: `Postman checked in for duty`,
    userId: parsed.data.userId,
  });

  res.status(201).json(CheckInResponse.parse(await enrichAttendance(record)));
});

router.patch("/attendance/:id/checkout", async (req, res): Promise<void> => {
  const params = CheckOutParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db.update(attendanceTable)
    .set({ checkOutTime: new Date() })
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(CheckOutResponse.parse(await enrichAttendance(record)));
});

export default router;
