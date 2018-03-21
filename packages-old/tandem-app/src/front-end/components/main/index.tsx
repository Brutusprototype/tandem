import "./index.scss";
import * as React from "react";
import { pure, compose } from "recompose";
import { Workspace } from "./workspace";
import { connect } from "react-redux";
import { Isolate } from "../isolated";
import { ImmutableObject, Dispatcher } from "aerial-common2";
import { ApplicationState, getSelectedWorkspace } from "front-end/state";

export type MainOuterProps = {
  dispatch: Dispatcher<any>
};

export type MainInnerProps = {
  dispatch: Dispatcher<any>;
  state: ApplicationState;
};

export const MainBase = ({ state, dispatch }: MainInnerProps) => {
  const workspace = getSelectedWorkspace(state);
  return <div className="main-component">
    { workspace && <Workspace state={state} workspace={workspace} dispatch={dispatch} /> }
  </div>;
}

const enhanceMain = compose<MainInnerProps, MainOuterProps>(
  connect((state: ApplicationState) => ({ state }))
);

export const Main = enhanceMain(MainBase);
