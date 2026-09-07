import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function resolvePersonPhoto(person, directory, projectRoot) {
  if (!person.photo) {
    return null;
  }

  if (path.basename(person.photo) !== person.photo) {
    throw new Error(
      `${path.relative(projectRoot, directory)}: "photo" must be a file name in the person's folder`
    );
  }

  const photoPath = path.join(directory, person.photo);
  try {
    await access(photoPath, constants.R_OK);
  } catch {
    throw new Error(
      `${path.relative(projectRoot, directory)}: photo "${person.photo}" does not exist`
    );
  }

  const parsedPhoto = path.parse(person.photo);
  const escapedStem = parsedPhoto.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedExtension = parsedPhoto.ext.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const versionPattern = new RegExp(
    `^${escapedStem}-(\\d+)${escapedExtension}$`,
    "i"
  );
  let latestPhoto = { fileName: person.photo, version: 1 };
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const match = entry.name.match(versionPattern);
    if (!match) {
      continue;
    }
    const version = Number.parseInt(match[1], 10);
    if (version > latestPhoto.version) {
      latestPhoto = { fileName: entry.name, version };
    }
  }

  return path.join(directory, latestPhoto.fileName);
}
