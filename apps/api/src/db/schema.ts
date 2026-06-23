import {
  account,
  accountRelations,
  file,
  fileRelations,
  project,
  projectFont,
  projectFontFace,
  projectFontFaceRelations,
  projectFontRelations,
  projectRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./models/index.js";

export * from "./models/index.js";

export const schema = {
  user,
  session,
  account,
  file,
  project,
  projectFont,
  projectFontFace,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
  fileRelations,
  projectRelations,
  projectFontRelations,
  projectFontFaceRelations,
};
