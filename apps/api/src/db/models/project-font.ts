import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { file } from "./file.js";
import { project } from "./project.js";

export type FontAxisJson = {
  tag: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export const projectFont = pgTable(
  "project_font",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    source: text("source").notNull(),
    family: text("family").notNull(),
    cssFamily: text("css_family"),
    role: text("role"),
    order: integer("order").notNull().default(0),
    category: text("category"),
    variants: jsonb("variants").$type<string[]>(),
    subsets: jsonb("subsets").$type<string[]>(),
    axes: jsonb("axes").$type<FontAxisJson[]>(),
    version: text("version"),
    lastModified: text("last_modified"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("project_font_project_id_idx").on(table.projectId),
    index("project_font_project_order_idx").on(table.projectId, table.order),
  ],
);

export const projectFontFace = pgTable(
  "project_font_face",
  {
    id: text("id").primaryKey(),
    projectFontId: text("project_font_id")
      .notNull()
      .references(() => projectFont.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => file.id, { onDelete: "set null" }),
    clientId: text("client_id").notNull(),
    fileKey: text("file_key"),
    fileUrl: text("file_url"),
    fileName: text("file_name").notNull(),
    size: integer("size").notNull(),
    sizeLabel: text("size_label").notNull(),
    format: text("format").notNull(),
    kind: text("kind").notNull(),
    weight: integer("weight").notNull(),
    weightRange: jsonb("weight_range").$type<{ min: number; max: number }>(),
    axes: jsonb("axes").$type<FontAxisJson[]>(),
    style: text("style").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("project_font_face_project_font_id_idx").on(table.projectFontId),
    index("project_font_face_file_id_idx").on(table.fileId),
  ],
);

export const projectFontRelations = relations(projectFont, ({ one, many }) => ({
  project: one(project, {
    fields: [projectFont.projectId],
    references: [project.id],
  }),
  faces: many(projectFontFace),
}));

export const projectFontFaceRelations = relations(
  projectFontFace,
  ({ one }) => ({
    projectFont: one(projectFont, {
      fields: [projectFontFace.projectFontId],
      references: [projectFont.id],
    }),
    file: one(file, {
      fields: [projectFontFace.fileId],
      references: [file.id],
    }),
  }),
);

export type ProjectFontRow = typeof projectFont.$inferSelect;
export type ProjectFontRowInsert = typeof projectFont.$inferInsert;
export type ProjectFontFaceRow = typeof projectFontFace.$inferSelect;
export type ProjectFontFaceRowInsert = typeof projectFontFace.$inferInsert;
