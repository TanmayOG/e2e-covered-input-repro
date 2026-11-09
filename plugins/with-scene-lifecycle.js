// iOS 27 stops an app at launch unless it adopts the UIScene life cycle.
// Expo SDK 57 ships the scene delegate (ExpoAppSceneDelegate) but the
// prebuild template does not use it yet, so this plugin wires it in:
// the Info.plist names the scene delegate, and the AppDelegate hands
// window creation to it instead of starting React Native itself.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const START_REACT_NATIVE = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    let source = mod.modResults.contents;
    if (!source.includes('ExpoReactNativeFactoryProvider')) {
      source = source.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    }
    source = source.replace(START_REACT_NATIVE, '    // ExpoAppSceneDelegate creates the window and starts React Native.\n');
    mod.modResults.contents = source;
    return mod;
  });
};
