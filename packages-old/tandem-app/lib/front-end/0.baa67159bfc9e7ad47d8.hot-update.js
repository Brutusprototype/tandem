webpackHotUpdate(0,{

/***/ "../aerial-browser-sandbox/lib/reducers/index.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var aerial_common2_1 = __webpack_require__("../aerial-common2/index.js");
var lodash_1 = __webpack_require__("./node_modules/lodash/lodash.js");
var actions_1 = __webpack_require__("../aerial-browser-sandbox/lib/actions/index.js");
var state_1 = __webpack_require__("../aerial-browser-sandbox/lib/state/index.js");
var WINDOW_PADDING = 50;
var getBestWindowBounds = function (browser, bounds) {
    if (!browser.windows.length)
        return bounds;
    var rightMostWindow = browser.windows.length > 1 ? browser.windows.reduce(function (a, b) {
        return a.bounds.right > b.bounds.right ? a : b;
    }) : browser.windows[0];
    return aerial_common2_1.moveBounds(bounds, {
        left: rightMostWindow.bounds.right + WINDOW_PADDING,
        top: rightMostWindow.bounds.top
    });
};
exports.syntheticBrowserReducer = function (root, event) {
    if (root === void 0) { root = state_1.createSyntheticBrowserRootState(); }
    switch (event.type) {
        case actions_1.SYNTHETIC_WINDOW_PROXY_OPENED: {
            var _a = event, instance = _a.instance, parentWindowId = _a.parentWindowId;
            var syntheticBrowser = void 0;
            syntheticBrowser = state_1.getSyntheticBrowser(root, instance.browserId);
            if (!syntheticBrowser) {
                console.warn("Unable to find synthetic browser with ID " + instance.browserId + ". It's likely that the app state was replaced.");
                return root;
            }
            return state_1.upsertSyntheticWindow(root, syntheticBrowser.$id, instance.struct);
        }
        case actions_1.SYNTHETIC_WINDOW_SCROLLED: {
            var _b = event, scrollPosition = _b.scrollPosition, syntheticWindowId = _b.syntheticWindowId;
            return state_1.updateSyntheticWindow(root, syntheticWindowId, {
                scrollPosition: scrollPosition,
            });
        }
        case actions_1.FILE_CONTENT_CHANGED: {
            var _c = event, publicPath = _c.publicPath, content = _c.content, mtime = _c.mtime;
            console.log(content);
            console.log("CONTENT CHANGED!", String.fromCharCode.apply(null, new Uint16Array(content)));
            return state_1.setFileCacheItem(publicPath, content, new Date(mtime), root);
        }
        case actions_1.SYNTHETIC_WINDOW_RESIZED:
        case actions_1.SYNTHETIC_WINDOW_MOVED: {
            var _d = event.instance, $id = _d.$id, screenLeft_1 = _d.screenLeft, screenTop_1 = _d.screenTop, innerWidth_1 = _d.innerWidth, innerHeight_1 = _d.innerHeight;
            return state_1.updateSyntheticWindow(root, $id, {
                bounds: {
                    left: screenLeft_1,
                    top: screenTop_1,
                    right: screenLeft_1 + innerWidth_1,
                    bottom: screenTop_1 + innerHeight_1,
                }
            });
        }
        case actions_1.SYNTHETIC_WINDOW_CLOSED: {
            var $id = event.instance.$id;
            return state_1.removeSyntheticWindow(root, $id);
        }
        case aerial_common2_1.MOVED: {
            var _e = event, itemId = _e.itemId, itemType = _e.itemType, point = _e.point;
            if (itemType === state_1.SYNTHETIC_WINDOW) {
                var window_1 = state_1.getSyntheticWindow(root, itemId);
                if (window_1) {
                    return state_1.updateSyntheticWindow(root, itemId, {
                        bounds: aerial_common2_1.moveBounds(window_1.bounds, point)
                    });
                }
                break;
            }
            break;
        }
        case aerial_common2_1.REMOVED: {
            var _f = event, itemId = _f.itemId, itemType = _f.itemType;
            if (itemType === state_1.SYNTHETIC_WINDOW) {
                return state_1.removeSyntheticWindow(root, itemId);
            }
            break;
        }
        case actions_1.SYNTHETIC_WINDOW_LOADED:
        case actions_1.SYNTHETIC_WINDOW_CHANGED: {
            var instance = event.instance;
            return state_1.updateSyntheticWindow(root, instance.$id, instance.struct);
        }
        case actions_1.SYNTHETIC_WINDOW_RECTS_UPDATED: {
            var _g = event, rects = _g.rects, styles = _g.styles, syntheticWindowId = _g.syntheticWindowId;
            return state_1.updateSyntheticWindow(root, syntheticWindowId, {
                allComputedBounds: rects,
                allComputedStyles: styles
            });
        }
        case actions_1.SYNTHETIC_WINDOW_RESOURCE_LOADED: {
            var _h = event, uri = _h.uri, syntheticWindowId = _h.syntheticWindowId;
            var window_2 = state_1.getSyntheticWindow(root, syntheticWindowId);
            return state_1.updateSyntheticWindow(root, syntheticWindowId, {
                externalResourceUris: lodash_1.uniq(window_2.externalResourceUris, uri)
            });
        }
    }
    return root;
};
//# sourceMappingURL=index.js.map

/***/ })

})