import { fork, put, take, call, spawn } from "redux-saga/effects";
import { eventChannel } from "redux-saga";
import { mapKeys } from "lodash";
import { shortcutKeyDown, SHORTCUT_A_KEY_DOWN, SHORTCUT_DELETE_KEY_DOWN, SHORTCUT_R_KEY_DOWN, SHORTCUT_T_KEY_DOWN, SHORTCUT_ESCAPE_KEY_DOWN } from "../actions";

export function* shortcutSaga() {
  // yield fork(mapHotkeys({

  //   // artboard
  //   "a": wrapDispatch(SHORTCUT_A_KEY_DOWN),

  //   // rectangle
  //   "r": wrapDispatch(SHORTCUT_R_KEY_DOWN),

  //   // text
  //   "t": wrapDispatch(SHORTCUT_T_KEY_DOWN),

  //   // artboard
  //   "escape": wrapDispatch(SHORTCUT_ESCAPE_KEY_DOWN),

  //   // artboard
  //   "backspace": wrapDispatch(SHORTCUT_DELETE_KEY_DOWN)
  // }));
}

const wrapDispatch = (type: string) => function*(sourceEvent) {
  // yield put(shortcutKeyDown(type));
}

const mapHotkeys = (map: {
  [identifier: string]: (event: KeyboardEvent) => any
}) => function*() {
  const ordererdMap = mapKeys(map, (value: any, key: string) => key.split(" ").sort().join(" "));
  const keysDown: string[] = [];

  const chan = yield eventChannel((emit) => {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (keysDown.indexOf(event.key) === -1) {
        keysDown.push(event.key);
      }
      const handler = ordererdMap[keysDown.join(" ").toLocaleLowerCase().split(" ").sort().join(" ")];
      if (handler) {
        emit(call(handler, event));
      }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
      keysDown.splice(keysDown.indexOf(event.key), 1);
    });
    return () => {

    };
  });

  while(1) {
    const action = yield take(chan);
    yield spawn(function*() {
      yield action;
    });
  }
};
