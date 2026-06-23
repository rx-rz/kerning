import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./user.js";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("project_owner_id_idx").on(table.ownerId),
    index("project_owner_updated_id_idx").on(
      table.ownerId,
      table.updatedAt,
      table.id,
    ),
  ],
);

export const projectRelations = relations(project, ({ one }) => ({
  owner: one(user, {
    fields: [project.ownerId],
    references: [user.id],
  }),
}));

export type ProjectRow = typeof project.$inferSelect;
export type ProjectRowInsert = typeof project.$inferInsert;
export type ProjectRowUpdate = Partial<ProjectRowInsert>;
