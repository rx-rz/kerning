import type {
  CreateProjectInput,
  ProjectFontInput,
  UpdateProjectInput,
} from "@kerning/shared";
import {
  MAX_PROJECT_FONT_FACES,
  MAX_PROJECT_FONT_FAMILIES,
} from "@kerning/shared";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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
  deleteFilesByParentInDB,
  listFilesByParentInDB,
} from "../../repository/files/index.js";
import { env } from "../../lib/env.js";
import { assertR2Configured, r2Client } from "../../storage/index.js";
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
  if (fonts.length > MAX_PROJECT_FONT_FAMILIES) {
    throw new BadRequestError(
      `Projects support up to ${MAX_PROJECT_FONT_FAMILIES} font families`,
    );
  }

  const faces = fonts.flatMap((font) => font.faces ?? []);
  if (faces.length > MAX_PROJECT_FONT_FACES) {
    throw new BadRequestError(
      `Projects support up to ${MAX_PROJECT_FONT_FACES} font files`,
    );
  }

  const oversized = faces.find((face) => face.size > MAX_FONT_FILE_SIZE);
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
  const existingProject = await getProjectDetailsInDB({
    projectId,
    ownerId: userId,
  });

  if (!existingProject) {
    throw new NotFoundError("Project not found");
  }

  const files = await listFilesByParentInDB({
    parentId: projectId,
    ownerId: userId,
  });

  if (files.length) {
    assertR2Configured();
    await Promise.all(
      files.map((file) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: env.CLOUDFLARE_BUCKET_NAME,
            Key: file.key,
          }),
        ),
      ),
    );
    await deleteFilesByParentInDB({ parentId: projectId, ownerId: userId });
  }

  const project = await deleteProjectInDB({
    projectId,
    ownerId: userId,
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
};
