

import { Action } from "redux";
import { PROJECT_LOADED, ProjectLoaded, SYNTHETIC_WINDOW_OPENED, CanvasToolOverlayMouseMoved, SyntheticWindowOpened, PROJECT_DIRECTORY_LOADED, ProjectDirectoryLoaded, FILE_NAVIGATOR_ITEM_CLICKED, FileNavigatorItemClicked, DEPENDENCY_ENTRY_LOADED, DependencyEntryLoaded, DOCUMENT_RENDERED, DocumentRendered, CANVAS_WHEEL, CANVAS_MOUSE_MOVED, CANVAS_MOUSE_CLICKED, WrappedEvent, CanvasToolOverlayClicked, RESIZER_MOUSE_DOWN, ResizerMouseDown, ResizerMoved, RESIZER_MOVED, RESIZER_PATH_MOUSE_STOPPED_MOVING, RESIZER_STOPPED_MOVING, ResizerPathStoppedMoving, RESIZER_PATH_MOUSE_MOVED, ResizerPathMoved } from "../actions";
import { RootState, setActiveFilePath, updateRootState, updateRootStateSyntheticBrowser, updateRootStateSyntheticWindow, updateRootStateSyntheticWindowDocument, updateCanvas, getCanvasMouseNodeTargetReference, setSelection, getSelectionBounds, updateRootSyntheticPosition, getBoundedSelection, updateRootSyntheticBounds } from "../state";
import { updateSyntheticBrowser, addSyntheticWindow, createSyntheticWindow, SyntheticNode, evaluateDependencyEntry, createSyntheticDocument, getSyntheticWindow, getSyntheticItemBounds, getSyntheticDocumentWindow, persistSyntheticItemPosition, persistSyntheticItemBounds, SyntheticObjectType } from "paperclip";
import { getTeeNodePath, getTreeNodeFromPath, getFilePath, File, getFilePathFromNodePath, EMPTY_OBJECT, TreeNode, StructReference, roundBounds, scaleInnerBounds, moveBounds, keepBoundsAspectRatio, keepBoundsCenter, Bounded, Struct, Bounds } from "common";

export const rootReducer = (state: RootState, action: Action) => {
  state = canvasReducer(state, action);
  switch(action.type) {
    case PROJECT_DIRECTORY_LOADED: {
      const { directory } = action as ProjectDirectoryLoaded;
      return updateRootState({ projectDirectory: directory }, state);
    }
    case FILE_NAVIGATOR_ITEM_CLICKED: {
      const { path } = action as FileNavigatorItemClicked;
      const filePath = getFilePathFromNodePath(path, state.projectDirectory);
      const window = createSyntheticWindow(filePath);
      state = updateRootState({
        browser: addSyntheticWindow(window, state.browser)
      }, state);
      return setActiveFilePath(window.location, state);
    }
    case DEPENDENCY_ENTRY_LOADED: {
      const { entry, graph } = action as DependencyEntryLoaded;

      state = updateRootStateSyntheticBrowser({
        graph: {
          ...(state.browser.graph || EMPTY_OBJECT),
          ...graph
        }
      }, state);

      const documents = evaluateDependencyEntry({ entry, graph }).documentNodes.map(root => {
        return createSyntheticDocument(root, graph);
      });

      return updateRootStateSyntheticWindow(entry.uri, {
        documents,
      }, state);
    }
    case DOCUMENT_RENDERED: {
      const { info, documentId, nativeMap } = action as DocumentRendered;
      return updateRootStateSyntheticWindowDocument(documentId, {
        nativeNodeMap: nativeMap,
        computed: info
      }, state);
    }
  }
  return state;
};

export const canvasReducer = (state: RootState, action: Action) => {
  switch(action.type) {
    case RESIZER_MOVED: {
      const { point: newPoint } = action as ResizerMoved;
      state = updateCanvas({
        movingOrResizing: true
      }, state);

      const translate = state.canvas.translate;

      const selectionBounds = getSelectionBounds(state);
      for (const item of state.selectionReferences) {
        const itemBounds = getSyntheticItemBounds(item, state.browser);
        const newBounds = roundBounds(scaleInnerBounds(itemBounds, selectionBounds, moveBounds(selectionBounds, newPoint)));
        state = updateRootSyntheticPosition(newBounds, item, state);
      }

      return state;
    }
    case RESIZER_STOPPED_MOVING: {
      const { point } = action as ResizerMoved;
      state = updateRootState({
        browser: state.selectionReferences.reduce((state, ref) => persistSyntheticItemPosition(point, ref, state), state.browser)
      }, state);
      state = updateCanvas({
        movingOrResizing: false
      }, state);
      return state;
    }

    case CANVAS_MOUSE_MOVED: {
      const { sourceEvent: { pageX, pageY }} = action as WrappedEvent<React.MouseEvent<any>>;
      state = updateCanvas({ mousePosition: { left: pageX, top: pageY }}, state);

      // TODO - in the future, we'll probably want to be able to highlight hovered nodes as the user is moving an element around to indicate where
      // they can drop the element.

      const targetRef = state.canvas.movingOrResizing ? null : getCanvasMouseNodeTargetReference(state, action as CanvasToolOverlayMouseMoved);

      state = updateRootState({
        hoveringReferences: targetRef ? [targetRef] : []
      }, state);

      return state;
    };

    // TODO
    case CANVAS_MOUSE_CLICKED: {
      const { sourceEvent } = action as CanvasToolOverlayClicked;
      if (/textarea|input/i.test((sourceEvent.target as Element).nodeName)) {
        return state;
      }

      // alt key opens up a new link
      const altKey = sourceEvent.altKey;

      // do not allow selection while window is panning (scrolling)
      if (state.canvas.panning || state.canvas.movingOrResizing) return state;

      const targetRef = getCanvasMouseNodeTargetReference(state, action as CanvasToolOverlayMouseMoved);

      if (!targetRef) {
        return state;
      }

      if (!altKey) {
        state = handleArtboardSelectionFromAction(state, targetRef, action as CanvasToolOverlayMouseMoved);
        state = updateCanvas({
          secondarySelection: false
        }, state);
        return state;
      }
      return state;
    }
    case RESIZER_PATH_MOUSE_MOVED: {
      state = updateCanvas({
        movingOrResizing: false
      }, state);

      // TODO - possibly use BoundsStruct instead of Bounds since there are cases where bounds prop doesn't exist
      const newBounds = getResizeActionBounds(action as ResizerPathMoved);
      for (const item of getBoundedSelection(state)) {
        state = updateRootSyntheticBounds(getNewSyntheticItemBounds(newBounds, item, state), item, state);
      }
      return state;
    }
    case RESIZER_PATH_MOUSE_STOPPED_MOVING: {
      state = updateCanvas({
        movingOrResizing: false
      }, state);

      // TODO - possibly use BoundsStruct instead of Bounds since there are cases where bounds prop doesn't exist
      const newBounds = getResizeActionBounds(action as ResizerPathStoppedMoving);
      state = updateRootState({
        browser: state.selectionReferences.reduce((browserState, ref) => persistSyntheticItemBounds(getNewSyntheticItemBounds(newBounds, ref, state), ref, browserState), state.browser)
      }, state);

      return state;
    }
  }

  return state;
};

const getNewSyntheticItemBounds = (newBounds: Bounds, item: Struct, state: RootState) => {
  const currentBounds = getSelectionBounds(state);
  const innerBounds = getSyntheticItemBounds(item, state.browser);
  return scaleInnerBounds(innerBounds, currentBounds, newBounds);
};

const getResizeActionBounds = (action: ResizerPathMoved|ResizerMoved) => {
  let { anchor, originalBounds, newBounds, sourceEvent } = action as ResizerPathMoved;

  const keepAspectRatio = sourceEvent.shiftKey;
  const keepCenter      = sourceEvent.altKey;

  if (keepCenter) {

    // TODO - need to test. this might not work
    newBounds = keepBoundsCenter(newBounds, originalBounds, anchor);
  }

  if (keepAspectRatio) {
    newBounds = keepBoundsAspectRatio(newBounds, originalBounds, anchor, keepCenter ? { left: 0.5, top: 0.5 } : anchor);
  }

  return newBounds;
}


const handleArtboardSelectionFromAction = <T extends { sourceEvent: React.MouseEvent<any> }>(state: RootState, ref: StructReference<any>, event: T) => {
  const { sourceEvent } = event;
  return setSelection(state, ref);
}

// const resizeFullScreenArtboard = (state: RootState, width: number, height: number) => {
//   const workspace = getSelectedWorkspace(state);
//   if (workspace.stage.fullScreen && workspace.stage.container) {

//     // TODO - do not all getBoundingClientRect here. Dimensions need to be
//     return updateArtboardSize(state, workspace.stage.fullScreen.artboardId, width, height);
//   }
//   return state;
// }

