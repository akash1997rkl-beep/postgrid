import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const beatsTable = pgTable("beats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  division: text("division").notNull(),
  postOffice: text("post_office").notNull(),
  totalHouses: integer("total_houses").notNull().default(0),
  totalArticles: integer("total_articles").notNull().default(0),
  assignedPostmanId: integer("assigned_postman_id"),
  status: text("status").notNull().default("active"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBeatSchema = createInsertSchema(beatsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type Beat = typeof beatsTable.$inferSelect;
