import { Action } from "redux";
import {
  queueOpenFiles,
  FSSandboxRootState,
  FS_SANDBOX_ITEM_LOADED,
  FSSandboxItemLoaded,
  fsSandboxReducer,
  getFileCacheItemsByMimetype,
  FileCacheItemStatus
} from "fsbox";
import {
  PC_SYNTHETIC_FRAME_RENDERED,
  PCFrameRendered,
  PC_DEPENDENCY_GRAPH_LOADED,
  PC_SYNTHETIC_FRAME_CONTAINER_CREATED,
  PCFrameContainerCreated,
  PCDependencyGraphLoaded,
  PC_SOURCE_FILE_URIS_RECEIVED,
  PCSourceFileUrisReceived
} from "./actions";
import { evaluatePCModule } from "./evaluate";
import {
  updateSyntheticVisibleNode,
  PCEditorState,
  updatePCEditorState,
  updateFrame,
  evaluateDependency,
  evaluateDependencyGraph
} from "./edit";
import { addFileCacheItemToDependencyGraph } from "./graph";
import { PAPERCLIP_MIME_TYPE } from "./constants";

export const paperclipReducer = <
  TState extends PCEditorState & FSSandboxRootState
>(
  state: TState,
  action: Action
): TState => {
  switch (action.type) {
    case PC_SYNTHETIC_FRAME_CONTAINER_CREATED: {
      const { frame, $container } = action as PCFrameContainerCreated;
      return updateFrame(
        {
          $container,
          computed: null
        },
        frame,
        state
      );
    }
    case PC_SOURCE_FILE_URIS_RECEIVED: {
      const { uris } = action as PCSourceFileUrisReceived;
      return queueOpenFiles(uris, state);
    }
    case PC_SYNTHETIC_FRAME_RENDERED: {
      const { frame, computed } = action as PCFrameRendered;
      return updateFrame(
        {
          computed
        },
        frame,
        state
      );
    }
    case PC_DEPENDENCY_GRAPH_LOADED: {
      const { graph } = action as PCDependencyGraphLoaded;
      return evaluateDependencyGraph(
        updatePCEditorState(
          {
            graph: {
              ...state.graph,
              ...graph
            }
          },
          state
        )
      );
    }
    case FS_SANDBOX_ITEM_LOADED: {
      const { uri, content, mimeType } = action as FSSandboxItemLoaded;
      const graph = addFileCacheItemToDependencyGraph(
        { uri, content },
        state.graph
      );
      return { ...(state as any), graph };
    }
  }
  return state;
};
