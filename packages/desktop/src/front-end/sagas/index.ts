import { fork, select, take, call, put } from "redux-saga/effects";
import * as fs from "fs";
import * as fsa from "fs-extra";
import { exec } from "child_process";
import * as path from "path";
import { ipcSaga } from "./ipc";
import { eventChannel } from "redux-saga";
import { ipcRenderer } from "electron";
import {
  RootState,
  // PROJECT_DIRECTORY_LOADED,
  FILE_NAVIGATOR_NEW_FILE_ENTERED,
  SHORTCUT_SAVE_KEY_DOWN,
  savedFile,
  FileNavigatorNewFileEntered,
  newFileAdded,
  FILE_NAVIGATOR_DROPPED_ITEM,
  getActiveEditorWindow,
  ADD_COMPONENT_CONTROLLER_BUTTON_CLICKED,
  componentControllerPicked,
  OPEN_CONTROLLER_BUTTON_CLCIKED,
  ComponentPickerItemClick,
  ComponentControllerItemClicked,
  FileNavigatorBasenameChanged,
  FILE_NAVIGATOR_BASENAME_CHANGED,
  PROJECT_INFO_LOADED
} from "tandem-front-end";
import {
  findPaperclipSourceFiles,
  pcSourceFileUrisReceived,
  getSyntheticSourceUri,
  getSyntheticNodeById,
  getSyntheticSourceNode
} from "paperclip";
import {
  getNestedTreeNodeById,
  addProtocol,
  stripProtocol,
  Directory,
  FILE_PROTOCOL,
  FSItemTagNames
} from "tandem-common";
// import { serverStateLoaded } from "../actions";
import { DesktopRootState } from "../state";

export function* rootSaga() {
  yield fork(ipcSaga);
  yield fork(handleSaveShortcut);
  // yield fork(handleActivePaperclipFile);
  yield fork(handleNewFileEntered);
  yield fork(handleBasenameChanged);
  yield fork(handleDroppedFile);
  yield fork(handleProjectDirectory);
  // yield fork(receiveServerState);
  yield fork(handleOpenController);
}

function* handleProjectDirectory() {
  while (1) {
    yield take(PROJECT_INFO_LOADED);
    yield call(loadPCFiles);
  }
}

function* loadPCFiles() {
  const { projectInfo }: DesktopRootState = yield select();
  if (!projectInfo) {
    return;
  }

  const sourceFiles = findPaperclipSourceFiles(
    projectInfo.config,
    stripProtocol(path.dirname(projectInfo.path))
  ).map(path => addProtocol(FILE_PROTOCOL, path));
  yield put(pcSourceFileUrisReceived(sourceFiles));
}

function* handleBasenameChanged() {
  while (1) {
    const { basename, item }: FileNavigatorBasenameChanged = yield take(
      FILE_NAVIGATOR_BASENAME_CHANGED
    );
    const filePath = stripProtocol(item.uri);
    const newFilePath = path.join(path.dirname(filePath), basename);

    // TODO - this needs to be a prompt
    if (fsa.existsSync(newFilePath)) {
      console.error(
        `Cannot rename file to ${basename} since the file already exists.`
      );
      continue;
    }

    fsa.renameSync(filePath, newFilePath);
  }
}

function* handleNewFileEntered() {
  while (1) {
    const {
      basename,
      directoryId,
      insertType
    }: FileNavigatorNewFileEntered = yield take(
      FILE_NAVIGATOR_NEW_FILE_ENTERED
    );
    const { projectDirectory }: RootState = yield select();
    const directory: Directory = getNestedTreeNodeById(
      directoryId,
      projectDirectory
    );
    const uri = directory.uri;
    const filePath = path.join(stripProtocol(uri), basename);

    if (fs.existsSync(filePath)) {
      continue;
    }

    if (insertType === FSItemTagNames.FILE) {
      fs.writeFileSync(filePath, "");
    } else {
      fs.mkdirSync(filePath);
    }

    yield put(newFileAdded(addProtocol(FILE_PROTOCOL, filePath), insertType));
  }
}

function* handleDroppedFile() {
  while (1) {
    const { node, targetNode, offset } = yield take(
      FILE_NAVIGATOR_DROPPED_ITEM
    );
    const root: RootState = yield select();
    const newNode = getNestedTreeNodeById(node.id, root.projectDirectory);
    const newUri = newNode.uri;
    const oldUri = node.uri;
    fsa.moveSync(stripProtocol(oldUri), stripProtocol(newUri));
  }
}

function* handleSaveShortcut() {
  while (1) {
    yield take(SHORTCUT_SAVE_KEY_DOWN);
    const state: RootState = yield select();
    const activeEditor = getActiveEditorWindow(state);
    for (const openFile of state.openFiles) {
      if (openFile.newContent) {
        yield call(saveFile, openFile.uri, openFile.newContent);
        yield put(savedFile(openFile.uri));
      }
    }
  }
}

const saveFile = (uri: string, content: Buffer) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(stripProtocol(uri), content, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

// function* 
// () {
//   const chan = eventChannel(emit => {
//     ipcRenderer.on("serverState", (event, arg) => emit(arg));
//     return () => {};
//   });

//   yield fork(function*() {
//     while (1) {
//       const state = yield take(chan);
//       yield put(serverStateLoaded(state));
//     }
//   });

//   // while (1) {
//   //   yield take(PROJECT_DIRECTORY_LOADED);
//   //   ipcRenderer.send("getServerState");
//   // }
// }

function* handleOpenController() {
  while (1) {
    const { relativePath }: ComponentControllerItemClicked = yield take(
      OPEN_CONTROLLER_BUTTON_CLCIKED
    );
    const state: DesktopRootState = yield select();
    const node = getSyntheticNodeById(
      state.selectedSyntheticNodeIds[0],
      state.documents
    );
    const sourceNodeUri = getSyntheticSourceUri(node, state.graph);
    const controllerPath = path.join(
      path.dirname(stripProtocol(sourceNodeUri)),
      relativePath
    );
    console.log("opening controller %s", controllerPath);
    exec(`open "${controllerPath}"`, error => {
      if (error) {
        alert(error.message);
      }
    });
  }
}
