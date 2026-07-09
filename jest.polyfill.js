global.__DEV__ = true;
global.__TEST__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

global.__fbBatchedBridgeConfig = {
  localModules: [],
  remoteModules: [],
  lazyModules: [],
};

global.nativeFabricUIManager = {};

global.nativeModuleProxy = {};

global.__turboModuleProxy = function () {
  return {};
};

global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};

global.requestAnimationFrame = function (cb) {
  return setTimeout(cb, 0);
};

global.performance = {
  now: function () {
    return Date.now();
  },
};

global.setImmediate = function (cb) {
  return setTimeout(cb, 0);
};

global.clearImmediate = function (id) {
  clearTimeout(id);
};
