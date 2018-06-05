import { fork, select, take, call, put } from "redux-saga/effects";
import * as fs from "fs";
import * as fsa from "fs-extra";
import * as path from "path";
import { ipcSaga } from "./ipc";
import {
  RootState,
  FILE_NAVIGATOR_ITEM_CLICKED,
  OPEN_FILE_ITEM_CLICKED,
  PAPERCLIP_DEFAULT_EXTENSIONS,
  FILE_NAVIGATOR_NEW_FILE_ENTERED,
  loadEntry,
  SHORTCUT_SAVE_KEY_DOWN,
  savedFile,
  getOpenFile,
  FileNavigatorNewFileEntered,
  getTreeNodeFromPath,
  getNestedTreeNodeById,
  FileAttributeNames,
  newFileAdded,
  InsertFileType,
  FILE_NAVIGATOR_DROPPED_ITEM,
  Dependency,
  DependencyGraph,
  PC_LAYER_EXPAND_TOGGLE_CLICK,
  PC_LAYER_CLICK,
  TreeLayerClick,
  SyntheticVisibleNode,
  QUICK_SEARCH_ITEM_CLICKED,
  getEditorWithActiveFileUri,
  getActiveEditor
} from "tandem-front-end";

export function* rootSaga() {
  yield fork(ipcSaga);
  yield fork(handleSaveShortcut);
  // yield fork(handleActivePaperclipFile);
  yield fork(handleNewFileEntered);
  yield fork(handleDroppedFile);
}

// function* handleActivePaperclipFile() {
//   let oldState: RootState;

//   while (1) {
//     yield take();
//     const state: RootState = yield select();
//     const { editors, browser } = state;

//     const newPCEditors = editors.filter(editor => {
//       return (
//         !getEditorWithActiveFileUri(editor.activeFilePath, oldState) &&
//         editor.activeFilePath.indexOf(PAPERCLIP_DEFAULT_EXTENSIONS) !== -1
//       );
//     });

//     oldState = state;

//     for (const editor of newPCEditors) {
//       yield call(openDependencyEntry, editor.activeFilePath);
//     }
//   }
// }

// function* openDependencyEntry(activeFilePath: string) {
//   const { browser } = yield select();
//   let graph: DependencyGraph = browser.graph;
//   let entry: Dependency = graph && graph[activeFilePath];

//   if (!entry) {
//     const result = yield call(loadEntry, activeFilePath, {
//       graph: browser.graph,
//       openFile: uri => fs.readFileSync(uri.substr("file://".length), "utf8")
//     });
//     entry = result.entry;
//     graph = result.graph;
//   }

//   yield put(dependencyEntryLoaded(entry, graph));
// }

function* handleNewFileEntered() {
  while (1) {
    const { basename }: FileNavigatorNewFileEntered = yield take(
      FILE_NAVIGATOR_NEW_FILE_ENTERED
    );
    const {
      insertFileInfo: { directoryId, type: insertType },
      projectDirectory
    }: RootState = yield select();
    const directory = getNestedTreeNodeById(directoryId, projectDirectory);
    const uri = directory.attributes.core;
    const filePath = uri.replace("file://", "") + basename;

    if (fs.existsSync(filePath)) {
      continue;
    }

    if (insertType === InsertFileType.FILE) {
      fs.writeFileSync(filePath, "");
    } else {
      fs.mkdirSync(filePath);
    }

    yield put(
      newFileAdded(
        directoryId,
        basename,
        insertType === InsertFileType.FILE ? "file" : "directory"
      )
    );
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
    fsa.moveSync(oldUri.replace("file:/", ""), newUri.replace("file:/", ""));
  }
}

function* handleSaveShortcut() {
  while (1) {
    yield take(SHORTCUT_SAVE_KEY_DOWN);
    const state: RootState = yield select();
    const activeEditor = getActiveEditor(state);
    const uri = activeEditor.activeFilePath;

    // TODO - post save
    if (!uri) {
      continue;
    }
    const openFile = getOpenFile(uri, state);

    if (openFile.newContent) {
      yield call(saveFile, uri, openFile.newContent);
      yield put(savedFile(uri));
    }
  }
}

const saveFile = (uri: string, content: Buffer) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(uri.substr("file:/".length), content, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
