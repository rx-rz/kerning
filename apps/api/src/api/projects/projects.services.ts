import type { CreateProjectInput, UpdateProjectInput } from "@kerning/shared";
import { InternalServerError, NotFoundError } from "http-errors-enhanced";

import {
  createProjectInDB,
  deleteProjectInDB,
  getProjectDetailsInDB,
  listProjectsInDB,
  replaceProjectFontsInDB,
  updateProjectInDB,
} from "../../repository/projects/index.js";

export const listProjectsService = async ({ userId }: { userId: string }) =>
  listProjectsInDB({ ownerId: userId });

export const getProjectDetailsService = async ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  const project = await getProjectDetailsInDB({ projectId, ownerId: userId });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
};

export const createProjectService = async ({
  dto,
  userId,
}: {
  dto: CreateProjectInput;
  userId: string;
}) => {
  const project = await createProjectInDB({
    dto: {
      ownerId: userId,
      name: dto.name,
    },
  });

  if (!project) {
    throw new InternalServerError("Unable to create project");
  }

  if (dto.fonts) {
    await replaceProjectFontsInDB({
      projectId: project.id,
      fonts: dto.fonts,
    });
  }

  return getProjectDetailsService({ projectId: project.id, userId });
};

export const updateProjectService = async ({
  projectId,
  dto,
  userId,
}: {
  projectId: string;
  dto: UpdateProjectInput;
  userId: string;
}) => {
  const { fonts, ...projectDto } = dto;
  let project =
    Object.keys(projectDto).length > 0
      ? await updateProjectInDB({
          projectId,
          ownerId: userId,
          dto: projectDto,
        })
      : await getProjectDetailsInDB({ projectId, ownerId: userId });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (fonts) {
    await replaceProjectFontsInDB({ projectId, fonts });
    project = await getProjectDetailsInDB({ projectId, ownerId: userId });
  }

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
};

export const deleteProjectService = async ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  const project = await deleteProjectInDB({
    projectId,
    ownerId: userId,
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
};
