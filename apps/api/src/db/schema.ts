import {
  account,
  accountRelations,
  project,
  projectRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from './models/index.js'

export * from './models/index.js'

export const schema = {
  user,
  session,
  account,
  project,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
  projectRelations,
}
