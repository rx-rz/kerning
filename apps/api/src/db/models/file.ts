import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./user.js";

export const file = pgTable(
  "file",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    parentId: text("parent_id").notNull(),
    parentType: text("parent_type").notNull(),
    isThumbnail: boolean("is_thumbnail").notNull().default(false),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("file_owner_id_idx").on(table.ownerId),
    index("file_parent_idx").on(table.parentType, table.parentId),
  ],
);

export const fileRelations = relations(file, ({ one }) => ({
  owner: one(user, {
    fields: [file.ownerId],
    references: [user.id],
  }),
}));

export type FileRow = typeof file.$inferSelect;
export type FileRowInsert = typeof file.$inferInsert;
