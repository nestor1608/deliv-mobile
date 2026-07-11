// Mock react-test-renderer for React 19 compatibility with @testing-library/react-native v14
const React = require('react');

const createRootMock = (container) => ({
  render: (element) => {
    // Simple synchronous render for testing
  },
  unmount: () => {},
});

const act = (callback) => callback();

const create = (element, options) => {
  const container = document ? document.createElement('div') : { _reactRootContainer: null };
  const root = createRootMock(container);

  return {
    root,
    toJSON() {
      if (element && element.type) {
        return { type: element.type, props: element.props, children: [] };
      }
      return null;
    },
    update(newElement) {
      root.render(newElement);
    },
    unmount() {
      root.unmount();
    },
  };
};

// Export as named exports for @testing-library/react-native compatibility
exports.createRoot = createRootMock;
exports.act = act;
exports.create = create;
exports.default = { createRoot: createRootMock, act, create };
