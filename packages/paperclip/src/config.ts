import * as fs from "fs";
import * as path from "path";
import { PAPERCLIP_CONFIG_DEFAULT_FILENAME } from "./constants";
import { isPaperclipUri } from "./graph";

// based on tsconfig
export type PCConfig = {
  rootDir: string;
  exclude: string[];
};

const DEFAULT_EXCLUDES = ["node_modules"];

export const creaPCConfig = (
  rootDir: string,
  exclude: string[] = DEFAULT_EXCLUDES
): PCConfig => ({
  rootDir,
  exclude
});

export const openPCConfig = (
  dir: string,
  configFileName: string = PAPERCLIP_CONFIG_DEFAULT_FILENAME
) => {
  const dirParts = dir.split("/");
  while (dirParts.length) {
    const possibleDir = dirParts.join("/");
    const configPath = path.join(possibleDir, configFileName);
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
    dirParts.pop();
  }

  return null;
};

export const findPaperclipSourceFiles = (config: PCConfig, cwd: string) => {
  const pcFilePaths: string[] = [];
  walkPCRootDirectory(config, cwd, filePath => {
    if (isPaperclipUri(filePath)) {
      pcFilePaths.push(filePath);
    }
  });

  return pcFilePaths;
};

export const walkPCRootDirectory = (
  { rootDir, exclude }: PCConfig,
  cwd: string,
  each: (filePath: string) => any
) => {
  const excludeRegexp = new RegExp(exclude.join("|"));
  const pcFilePaths: string[] = [];

  if (rootDir.charAt(0) === ".") {
    rootDir = path.resolve(cwd, rootDir);
  }

  walkFiles(rootDir, filePath => {
    if (excludeRegexp.test(filePath)) {
      return false;
    }
    each(filePath);
  });
};

const walkFiles = (
  filePath: string,
  each: (filePath: string) => boolean | void
) => {
  if (each(filePath) === false) {
    return;
  }

  if (!fs.lstatSync(filePath).isDirectory()) {
    return;
  }

  const subpaths = fs
    .readdirSync(filePath)
    .map(basename => filePath + "/" + basename);

  for (let i = 0, { length } = subpaths; i < length; i++) {
    walkFiles(subpaths[i], each);
  }
};
