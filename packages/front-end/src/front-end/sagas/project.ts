import { fork, put, call, take, select } from "redux-saga/effects";
import { projectDirectoryLoaded, PROJECT_DIRECTORY_LOADED, FILE_NAVIGATOR_ITEM_CLICKED, fileNavigatorItemClicked, dependencyEntryLoaded, FileNavigatorItemClicked, OpenFilesItemClick, OPEN_FILE_ITEM_CLICKED, SHORTCUT_SAVE_KEY_DOWN, savedFile } from "../actions";
import { PAPERCLIP_EXTENSION_NAME, loadEntry } from "../../paperclip";
import { File, Directory, xmlToTreeNode, getFilesWithExtension, getFilePath, getTeeNodePath, getTreeNodeFromPath, getFilePathFromNodePath } from "../../common";
import { RootState, getActiveWindow } from "../state";

export function* projectSaga() {
  // yield fork(handleProjectDirectoryLoaded);
  yield fork(putFakeDirectory);
  yield fork(handleSaveShortcut);
}

function* putFakeDirectory() {
  const rootDirectory = xmlToTreeNode(`
    <directory name="components">
      <file name="main.pc">
      </file>
    </directory>
  `) as Directory;

  yield put(projectDirectoryLoaded(rootDirectory));
}

// function* handleProjectDirectoryLoaded() {
//   while(1) {
//     yield take(PROJECT_DIRECTORY_LOADED);
//     // const { projectDirectory }: RootState = yield select();
//     // const [mainPaperclipFile] = getFilesWithExtension(PAPERCLIP_EXTENSION_NAME, projectDirectory);
//     // yield put(fileNavigatorItemClicked(getTeeNodePath(mainPaperclipFile.id, projectDirectory)));
//   }
// }

const TEST_FILES = {
  "components/main.pc": `
    <module>
      <component id="test" preview:bounds="left: 0; right: 100; top: 50; bottom: 150">
        <template style="font-family: Helvetica; background-color: red; color: white; width: 100px; height: 100px; border-radius: 10px;">
          <div style="background: blue; display: inline-block;" ref="bg">
            <text ref="hello" value="helloaa==" />
          </div>
        </template>
      </component>
      <component id="test2" extends="test" preview:bounds="left: 100; right: 200; top: 50; bottom: 150">
        <overrides>
          <delete-child target="hello" />
        </overrides>
      </component>
      <component id="test3" extends="test" preview:bounds="left: 0; right: 100; top: 200; bottom: 300">
        <overrides>
          <insert-child before="hello">
            <text value="world" />
          </insert-child>
        </overrides>
      </component>
      <component id="test4" extends="test3" preview:bounds="left: 0; right: 100; top: 350; bottom: 450">
        <overrides>
          <set-attribute target="hello" name="value" value="blarg" />
          <set-style name="background-color" value="blue" />
          <set-style target="bg" name="background-color" value="green" />
        </overrides>
      </component>
    </module>
  `
}


function* handleSaveShortcut() {
  while(1) {
    yield take(SHORTCUT_SAVE_KEY_DOWN);
    const state: RootState = yield select();
    const uri = state.activeFilePath;
    if (!uri) {
      continue;
    }
    yield put(savedFile(uri));
  }
}