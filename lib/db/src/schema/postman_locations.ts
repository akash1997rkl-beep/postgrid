import { pgTable, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postmanLocationsTable = pgTable("postman_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  beatId: integer("beat_id"),
  latitude: real("latitude").notNull().default(20.5937),
  longitude: real("longitude").notNull().default(78.9629),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  isOnDuty: boolean("is_on_duty").notNull().default(false),
  deliveriesCompleted: integer("deliveries_completed").notNull().default(0),
});

export const insertPostmanLocationSchema = createInsertSchema(postmanLocationsTable).omit({ id: true });
export type InsertPostmanLocation = z.infer<typeof insertPostmanLocationSchema>;
export type PostmanLocation = typeof postmanLocationsTable.$inferSelect;
