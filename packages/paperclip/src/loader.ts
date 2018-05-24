/**
TODOS:

- better error messaging for files that are not found
*/

import { TreeNode, addTreeNodeIds } from "tandem-common/lib/state";
import { resolveFilePath, EMPTY_OBJECT, xmlToTreeNode } from "tandem-common/lib/utils";
import { Module, Component, ComponentOverride, getModuleInfo, Dependency, DependencyGraph } from "./dsl";
export type FileLoader = (uri: string) => string | Promise<string>;

export type LoadEntryOptions = {
  openFile: FileLoader;
  graph?: DependencyGraph;
};

export type LoadEntryResult = {
  entry: Dependency;
  graph: DependencyGraph;
};

export const loadEntry = async (entryFileUri: string, options: LoadEntryOptions): Promise<LoadEntryResult> => {
  const graph: DependencyGraph = { ...(options.graph || EMPTY_OBJECT) };
  const queue: string[] = [entryFileUri];
  while(queue.length) {
    const currentUri = queue.shift();
    if (graph[currentUri]) {
      continue;
    }
    const module = await loadModule(currentUri, options);

    const absolutePaths = [];
    const importUris = {};

    for (const xmlns in module.imports) {
      const relativePath = module.imports[xmlns];
      const absolutePath = resolveFilePath(relativePath, currentUri);
      importUris[relativePath] = absolutePath;
      queue.push(absolutePath);
    }

    const dependency = createDependency(currentUri, module.source, importUris);
    graph[currentUri] = dependency;
  }

  return {
    entry: graph[entryFileUri],
    graph
  };
};

const createDependency = (uri: string, content: TreeNode, importUris): Dependency => ({
  uri,
  content,
  originalContent: content,
  importUris
});

const parseNodeSource = (source: string) => {
  try {
    return addTreeNodeIds(JSON.parse(source));
  } catch(e) {
    return xmlToTreeNode(source);
  }
}

const loadModule = async (uri: string, options: LoadEntryOptions): Promise<Module> => {
  const content = await options.openFile(uri);

  // TODO - support other extensions in the future like images
  if (/xml$/.test(uri)) {

    // TODO - transform XML to JSON
    throw new Error(`XML is not supported yet`);
  } else if (/pc$/.test(uri)) {
    try {
      const moduleSource = parseNodeSource(content);
      return getModuleInfo(moduleSource);
    } catch(e) {
      console.warn(e);
      return getModuleInfo(addTreeNodeIds({
        name: "module",
        attributes: {},
        children: [],
      }));
    }
  } else if (!/json$/.test(uri)) {
    throw new Error(`Unsupported import ${uri}.`);
  } else {
    const moduleSource = JSON.parse(content);
    return getModuleInfo(moduleSource);
  }
};