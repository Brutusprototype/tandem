"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUTATED = "MUTATED";
exports.SET_VALUE_MUTATION = "SET_VALUE_MUTATION";
exports.INSERT_CHILD_MUTATION = "INSERT_CHILD_MUTATION";
exports.REMOVE_CHILD_MUTATION = "REMOVE_CHILD_MUTATION";
exports.SET_PROPERTY_MUTATION = "SET_PROPERTY_MUTATION";
exports.REMOVE_MUTATION = "REMOVE_MUTATION";
exports.createMutationEvent = function (mutation) { return ({
    type: exports.MUTATED,
    mutation: mutation
}); };
exports.createSetValueMutation = function (type, target, newValue) { return ({
    type: type,
    target: target,
    newValue: newValue
}); };
exports.createInsertChildMutation = function (type, target, child, index, clone) {
    if (index === void 0) { index = Number.MAX_SAFE_INTEGER; }
    return ({
        type: type,
        target: target,
        child: child,
        index: index,
        clone: clone
    });
};
exports.createRemoveChildMutation = function (type, target, child, index) { return ({
    type: type,
    target: target,
    child: child,
    index: index
}); };
exports.createMoveChildMutation = function (type, target, child, index, oldIndex) { return ({
    type: type,
    target: target,
    child: child,
    index: index,
    oldIndex: oldIndex
}); };
exports.createPropertyMutation = function (type, target, name, newValue, oldValue, oldName, index) { return ({
    type: type,
    target: target,
    name: name,
    newValue: newValue,
    oldValue: oldValue,
    oldName: oldName,
    index: index
}); };
exports.createRemoveMutation = function (type, target, newValue, oldValue, oldName, index) { return ({
    type: type,
    target: target
}); };
//# sourceMappingURL=base.js.map