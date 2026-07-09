jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        devApiUrl: 'http://localhost:8000/api',
      },
    },
  },
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (dict) => dict.ios,
  Version: 15,
  constants: {},
}));

jest.mock('react-native/Libraries/Components/View/View', () => {
  const React = require('react');
  const View = (props) => React.createElement('View', props, props.children);
  return View;
});

jest.mock('react-native/Libraries/Text/Text', () => {
  const React = require('react');
  const Text = (props) => React.createElement('Text', props, props.children);
  return Text;
});

jest.mock('react-native/Libraries/Image/Image', () => {
  const React = require('react');
  const Image = (props) => React.createElement('Image', props);
  return Image;
});

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = require('react');
  const ScrollView = (props) => React.createElement('ScrollView', props, props.children);
  return ScrollView;
});

jest.mock('react-native/Libraries/Components/TextInput/TextInput', () => {
  const React = require('react');
  const TextInput = (props) => React.createElement('TextInput', props);
  return TextInput;
});
