import { init } from "./index";
import { SyntheticObjectType } from "../paperclip";

init({
  mount: document.getElementById("application"),
  hoveringNodeIds: [],
  editors: [],
  selectedNodeIds: [],
  selectedFileNodeIds: [],
  canvas: {
    backgroundColor: "#EFEFEF",
    translate: {
      left: 0,
      top: 0,
      zoom: 1
    }
  },
  history: {},
  openFiles: [],
  browser: {
    windows: [],
    type: SyntheticObjectType.BROWSER
  }
})