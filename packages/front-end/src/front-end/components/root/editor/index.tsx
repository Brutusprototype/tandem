import "./index.scss";
import { Dispatch } from "redux";
import * as React from "react";
import { Dependency } from "../../../../paperclip";
import { compose, pure } from "recompose";
import { StageComponent } from "./stage";
import { LeftGutterComponent } from "./left-gutter";
import { RightGutterComponent } from "./right-gutter";
import { RootState, getActiveWindow } from "../../../state";

export type EditorOuterProps = {
  root: RootState;
  dispatch: Dispatch<any>;
};

const EditorBaseComponent = ({ root, dispatch }: EditorOuterProps) => {
  const window = getActiveWindow(root);
  const dependency = window && root.browser.graph && root.browser.graph[window.location];
  return <div className="m-editor">
    <LeftGutterComponent activeFileUri={root.activeFilePath} rootDirectory={root.projectDirectory} dispatch={dispatch} root={root} />
    <StageComponent root={root} dispatch={dispatch} dependency={dependency} />
    <RightGutterComponent root={root} dispatch={dispatch} />
  </div>;
}

export const EditorComponent = compose<EditorOuterProps, EditorOuterProps>(pure)(EditorBaseComponent);