import "./scss/index.scss";

const reduceReducers = require("reduce-reducers");
import * as React from "react";
import * as ReactDOM from "react-dom";
import { circular, parallel } from "mesh";
import { flowRight } from "lodash";
import { Main } from "./components";
import { AppContainer } from "react-hot-loader";
import { applicationReducer } from "./reducers";
import { createApplicationState, ApplicationState } from "./state";
import { mainSaga } from "./sagas";
import { Provider } from "react-redux";
import { createWorkerMiddleware } from "./middleware";
import { 
  ImmutableObject,
  initBaseApplication2, 
  BaseApplicationState,
} from "aerial-common2";

const mainReducer = reduceReducers(
  applicationReducer
);

export const initApplication = (initialState: ApplicationState) => {
  const store = initBaseApplication2(
    initialState, 
    mainReducer, 
    mainSaga,
    createWorkerMiddleware()
  );

  const render = (Main) => {
    ReactDOM.render(<Provider store={store}>
      <Main dispatch={action => store.dispatch(action)} />
    </Provider>, initialState.element)
  }
  
  render(Main);

  // if (module["hot"]) {
  //   module["hot"].accept(() => {
  //     render(Main);
  //     debugger;
  //   });
  // }
}
