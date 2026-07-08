import type {
  CreateProjectInput,
  ProjectFontInput,
  UpdateProjectInput,
} from "@kerning/shared";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "http-errors-enhanced";

import {
  createProjectInDB,
  deleteProjectInDB,
  getProjectDetailsInDB,
  listProjectsInDB,
  replaceProjectFontsInDB,
  updateProjectInDB,
} from "../../repository/projects/index.js";
import {
  MAX_FONT_FILE_SIZE,
  selfHostGoogleFonts,
} from "../google-fonts/google-font-import.services.js";

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
    assertFontSizes(dto.fonts);
    const fonts = await selfHostGoogleFonts({
      fonts: dto.fonts,
      projectId: project.id,
      userId,
    });
    await replaceProjectFontsInDB({
      projectId: project.id,
      fonts,
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
    assertFontSizes(fonts);
    const hostedFonts = await selfHostGoogleFonts({ fonts, projectId, userId });
    await replaceProjectFontsInDB({ projectId, fonts: hostedFonts });
    project = await getProjectDetailsInDB({ projectId, ownerId: userId });
  }

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
};

function assertFontSizes(fonts: ProjectFontInput[]) {
  const oversized = fonts
    .flatMap((font) => font.faces ?? [])
    .find((face) => face.size > MAX_FONT_FILE_SIZE);
  if (oversized) {
    throw new BadRequestError(
      `${oversized.fileName} exceeds the 10 MB font file limit`,
    );
  }
}

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
