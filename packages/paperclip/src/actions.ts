import { ComputedDisplayInfo, Frame } from "./edit";
import { Action } from "redux";
import { Dependency, DependencyGraph } from "./graph";

export const PC_SYNTHETIC_FRAME_RENDERED = "PC_SYNTHETIC_FRAME_RENDERED";
export const PC_DEPENDENCY_LOADED = "PC_DEPENDENCY_LOADED";
export const PC_SYNTHETIC_FRAME_CONTAINER_CREATED =
  "PC_SYNTHETIC_FRAME_CONTAINER_CREATED";

export type PCFrameContainerCreated = {
  frame: Frame;
  $container: HTMLElement;
} & Action;

export type PCFrameRendered = {
  frame: Frame;
  computed: ComputedDisplayInfo;
} & Action;

export type PCDependencyLoaded = {
  uri: string;
  graph: DependencyGraph;
} & Action;

export const pcFrameRendered = (
  frame: Frame,
  computed: ComputedDisplayInfo
): PCFrameRendered => ({
  type: PC_SYNTHETIC_FRAME_RENDERED,
  frame,
  computed
});

export const pcDependencyLoaded = (
  uri: string,
  graph: DependencyGraph
): PCDependencyLoaded => ({
  uri,
  graph,
  type: PC_DEPENDENCY_LOADED
});

export const pcFrameContainerCreated = (
  frame: Frame,
  $container: HTMLElement
): PCFrameContainerCreated => ({
  frame,
  $container,
  type: PC_SYNTHETIC_FRAME_CONTAINER_CREATED
});
