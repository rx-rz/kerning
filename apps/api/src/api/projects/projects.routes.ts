import {
  CreateProjectInputSchema,
  ProjectIdSchema,
  PROJECT_ROUTES,
  UpdateProjectInputSchema,
} from '@kerning/shared'
import { Hono } from 'hono'

import { getUserFromContext, requireAuth } from '../../middleware/auth.js'
import { parseJson, parseValue } from '../../lib/http.js'
import {
  createProjectService,
  deleteProjectService,
  getProjectDetailsService,
  listProjectsService,
  updateProjectService,
} from './projects.services.js'

export const projectRoutes = new Hono()

projectRoutes.use('*', requireAuth)

projectRoutes.get(PROJECT_ROUTES.list, async (c) => {
  const user = getUserFromContext(c)
  const projects = await listProjectsService({ userId: user.id })
  return c.json({ status: 'success', data: { projects } })
})

projectRoutes.get(PROJECT_ROUTES.detail, async (c) => {
  const projectId = parseValue(ProjectIdSchema, c.req.param('projectId'))
  const user = getUserFromContext(c)
  const project = await getProjectDetailsService({
    projectId,
    userId: user.id,
  })

  return c.json({ status: 'success', data: { project } })
})

projectRoutes.post(PROJECT_ROUTES.create, async (c) => {
  const dto = await parseJson(c.req.raw, CreateProjectInputSchema)
  const user = getUserFromContext(c)
  const project = await createProjectService({
    dto,
    userId: user.id,
  })

  return c.json({ status: 'success', data: { project } }, 201)
})

projectRoutes.patch(PROJECT_ROUTES.detail, async (c) => {
  const projectId = parseValue(ProjectIdSchema, c.req.param('projectId'))
  const dto = await parseJson(c.req.raw, UpdateProjectInputSchema)
  const user = getUserFromContext(c)
  const project = await updateProjectService({
    projectId,
    dto,
    userId: user.id,
  })

  return c.json({ status: 'success', data: { project } })
})

projectRoutes.delete(PROJECT_ROUTES.detail, async (c) => {
  const projectId = parseValue(ProjectIdSchema, c.req.param('projectId'))
  const user = getUserFromContext(c)
  const project = await deleteProjectService({
    projectId,
    userId: user.id,
  })

  return c.json({ status: 'success', data: { project } })
})
