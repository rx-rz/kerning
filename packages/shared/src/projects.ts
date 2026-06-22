import * as v from 'valibot'

export const PROJECT_ROUTES = {
  list: '/projects',
  create: '/projects',
  detail: '/projects/:projectId',
} as const

export const ProjectIdSchema = v.pipe(
  v.string(),
  v.minLength(1, 'Project id is required')
)

export const ProjectNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Project name is required'),
  v.maxLength(120, 'Project name must be 120 characters or fewer')
)

export const ProjectEntitySchema = v.object({
  id: ProjectIdSchema,
  name: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
  version: v.literal(1),
})

export const CreateProjectInputSchema = v.object({
  name: ProjectNameSchema,
})

export const UpdateProjectInputSchema = v.pipe(
  v.object({
    name: v.optional(ProjectNameSchema),
  }),
  v.partialCheck(
    [['name']],
    ({ name }) => name !== undefined,
    'At least one project field must be provided'
  )
)

export type ProjectEntity = v.InferOutput<typeof ProjectEntitySchema>
export type CreateProjectInput = v.InferOutput<typeof CreateProjectInputSchema>
export type UpdateProjectInput = v.InferOutput<typeof UpdateProjectInputSchema>
