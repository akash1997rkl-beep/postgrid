import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, deliveriesTable, usersTable, beatsTable, articlesTable, attendanceTable, activitiesTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetDashboardActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [totalDeliveriesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveriesTable);
  const [pendingResult] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveriesTable).where(eq(deliveriesTable.status, "pending"));
  const [deliveredTodayResult] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveriesTable).where(
    and(eq(deliveriesTable.status, "delivered"), eq(deliveriesTable.scheduledDate, today))
  );
  const [activePostmenResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(
    and(eq(usersTable.role, "postman"), eq(usersTable.isActive, true))
  );
  const [totalBeatsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(beatsTable).where(eq(beatsTable.status, "active"));
  const [presentTodayResult] = await db.select({ count: sql<number>`count(*)::int` }).from(attendanceTable).where(eq(attendanceTable.date, today));
  const [totalArticlesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(articlesTable);
  const [totalD] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveriesTable);
  const [deliveredAll] = await db.select({ count: sql<number>`count(*)::int` }).from(deliveriesTable).where(eq(deliveriesTable.status, "delivered"));

  const total = totalDeliveriesResult?.count ?? 0;
  const delivered = deliveredAll?.count ?? 0;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100 * 10) / 10 : 0;

  const stats = {
    totalDeliveries: total,
    pendingDeliveries: pendingResult?.count ?? 0,
    deliveredToday: deliveredTodayResult?.count ?? 0,
    activePostmen: activePostmenResult?.count ?? 0,
    totalBeats: totalBeatsResult?.count ?? 0,
    presentToday: presentTodayResult?.count ?? 0,
    totalArticles: totalArticlesResult?.count ?? 0,
    deliveryRate,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const activities = await db.select().from(activitiesTable)
    .orderBy(sql`${activitiesTable.timestamp} DESC`)
    .limit(20);

  const enriched = await Promise.all(activities.map(async (a) => {
    let userName: string | null = null;
    if (a.userId) {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.userId));
      userName = user?.name ?? null;
    }
    return {
      ...a,
      userId: a.userId ?? null,
      userName,
    };
  }));

  res.json(GetDashboardActivityResponse.parse(enriched));
});

export default router;
