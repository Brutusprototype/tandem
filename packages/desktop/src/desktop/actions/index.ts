import { Action } from "redux";
import { TDProject } from "../state";
import { publicActionCreator, Directory } from "tandem-common";

export const APP_READY = "APP_READY";
export const MAIN_WINDOW_OPENED = "MAIN_WINDOW_OPENED";
export const TD_PROJECT_LOADED = "TD_PROJECT_LOADED";
export const PREVIEW_SERVER_STARTED = "PREVIEW_SERVER_STARTED";
export const OPEN_PROJECT_MENU_ITEM_CLICKED = "OPEN_PROJECT_MENU_ITEM_CLICKED";
export const NEW_PROJECT_MENU_ITEM_CLICKED = "NEW_PROJECT_MENU_ITEM_CLICKED";
export const TD_PROJECT_FILE_PICKED = "TD_PROJECT_FILE_PICKED";

export type AppReady = {} & Action;
export type TDProjectLoaded = {
  project: TDProject;
  path: string;
} & Action;

export type TDProjectFilePicked = {
  filePath: string;
} & Action;

export type PreviewServerStarted = {
  port: number;
} & Action;

export const appReady = (): AppReady => ({ type: APP_READY });
export const tdProjectFilePicked = (filePath: string): TDProjectFilePicked => ({
  filePath,
  type: TD_PROJECT_FILE_PICKED
});

export const componentControllerPicked = publicActionCreator(
  (filePath: string) => ({
    filePath,
    type: "COMPONENT_CONTROLLER_PICKED"
  })
);

export const mainWindowOpened = (): Action => ({ type: MAIN_WINDOW_OPENED });

export const tdProjectLoaded = publicActionCreator((project: TDProject, path: string): TDProjectLoaded => ({
  type: TD_PROJECT_LOADED,
  project,
  path
}));

export const previewServerStarted = (port: number): PreviewServerStarted => ({
  type: PREVIEW_SERVER_STARTED,
  port
});

// export const projectDirectoryLoaded = publicActionCreator(
//   (directory: Directory) => ({
//     directory,
//     type: "PROJECT_DIRECTORY_LOADED"
//   })
// );
