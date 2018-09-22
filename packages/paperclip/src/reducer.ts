import { Action } from "redux";
import {
  queueOpenFiles,
  FSSandboxRootState,
  FS_SANDBOX_ITEM_LOADED,
  FSSandboxItemLoaded
} from "fsbox";
import {
  PC_SYNTHETIC_FRAME_RENDERED,
  PCFrameRendered,
  PC_SYNTHETIC_FRAME_CONTAINER_CREATED,
  PCFrameContainerCreated,
  PC_SOURCE_FILE_URIS_RECEIVED,
  PCSourceFileUrisReceived,
  PC_RUNTIME_EVALUATED,
  PCRuntimeEvaluated
} from "./actions";
import {
  PCEditorState,
  updateFrame,
  upsertFrames
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
    case PC_RUNTIME_EVALUATED: {
      const { allDocuments, catchingUp } = action as PCRuntimeEvaluated;
      if (catchingUp) {
        return state;
      }
      return upsertFrames({
        ...Object(state as any),
        documents: allDocuments
      });
    }
    case PC_SOURCE_FILE_URIS_RECEIVED: {
      const { uris } = action as PCSourceFileUrisReceived;
      state = queueOpenFiles(uris, state);
      let graph = {...state.graph};
      let graphChanged = false;
      for (const uri in graph) {
        if (uris.indexOf(uri) === -1) {
          graphChanged = true;
          delete graph[uri];
        }
      }
      if (graphChanged) {
        state = {...(state as any), graph};
      }

      state = {...(state as any), pcUris: uris };

      return state;
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
    case FS_SANDBOX_ITEM_LOADED: {
      const { uri, content, mimeType } = action as FSSandboxItemLoaded;

      // dependency graph can only load files that are within the scope of the project via PC_SOURCE_FILE_URIS_RECEIVED
      if (mimeType !== PAPERCLIP_MIME_TYPE || state.pcUris.indexOf(uri) === -1) {
        return state;
      }

      const graph = addFileCacheItemToDependencyGraph(
        { uri, content },
        state.graph
      );
      return { ...(state as any), graph };
    }
  }
  return state;
};
