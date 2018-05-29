import { Mutation } from "source-mutation";
import { PaperclipStateRootState } from "../state";

export const apiEditFile = async (
  mutationsByUri: { [identifier: string]: Mutation<any>[] },
  { apiHost }: PaperclipStateRootState
) => {
  const serializedMutationsByUri = {};

  for (const uri in mutationsByUri) {
    serializedMutationsByUri[uri] = mutationsByUri[uri].map(mutation => ({
      ...mutation,
      target: { source: mutation.target.source },
      child: (mutation as any).child && {
        source: (mutation as any).child.source
      }
    }));
  }

  const response = await fetch(`${apiHost}/edit`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify(serializedMutationsByUri)
  });

  return await response.json();
};
