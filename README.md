# Reproduction: a covered TextInput reads as visible

For [tester-army/e2e#1324](https://github.com/tester-army/e2e/issues/1324).

Opening the keyboard raises a Back/Next footer over the Brand input. A person can't see or tap Brand, but e2e treats it as visible:

- `expect(brand).toBeHidden()` fails: "observed: visible".
- `screen.scrollUntilVisible(brand)` returns without scrolling.
- `brand.tap()`, `brand.pressSequentially()` and `brand.fill()` report success, but the touch lands on the footer. Product name keeps focus, so the text goes into Product name.

The app is one Expo screen. The layout pins Brand under the footer on any screen size, with the keyboard open or closed, so the failure happens on every run. In a real app the footer only lands on the next input for some screen and keyboard sizes, which is why it shows up as a flake.

## Run it

Needs Node.js 24.8+, and the Android SDK or Xcode for the platform you run.

```sh
git clone https://github.com/TanmayOG/e2e-covered-input-repro.git
cd e2e-covered-input-repro
npm ci
```

Android (a phone or emulator on `adb`):

```sh
npm run android          # release build, installs dev.e2erepro.coveredinput
npm run repro:android    # exits 1 on e2e 0.23.0: all 6 repro tests fail
npm run control:android  # exits 0: both controls pass
```

iOS (a booted simulator). Clone to a path without spaces: React Native's "Bundle React Native code and images" build phase breaks on a space in the path.

```sh
npm run ios
npm run repro:ios
npm run control:ios
```

- iOS 27 stops an app at launch unless it adopts the UIScene life cycle. `plugins/with-scene-lifecycle.js` wires in Expo's `ExpoAppSceneDelegate` during prebuild.
- Turn off the simulator's hardware keyboard (`defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false`, then reboot the simulator), so the on-screen keyboard opens with the first field the way it does on a phone. With the Mac's keyboard connected, the on-screen keyboard only opens on a tap, the form shrinks under agent-device's fill, and Brand moves before it types.

With more than one device connected, set `ANDROID_DEVICE` to the phone's model name, or `IOS_SIMULATOR_UDID`.

## Results

Android 16 phone (vivo I2220, Gboard) and iOS 27.2 simulator (iPhone 18 Pro). Expo SDK 57, React Native 0.86.3, `agent-device` 0.21.36.

| | e2e 0.23.0 | with the fix |
|---|---|---|
| Android, `tests/repro.e2e.ts` | 0/6 | 6/6 |
| iOS, `tests/repro.e2e.ts` | 0/6 | 6/6 |
| Android and iOS, `tests/control.e2e.ts` | 2/2 | 2/2 |

On e2e 0.23.0 (the 0.23.1 nightly behaves the same):

| Test | Expected | Observed |
|---|---|---|
| a TextInput under the footer reads as hidden | hidden | `visible (match count 1)` |
| a tap on the covered Brand input never presses the footer | `Footer taps: 0` | `Footer taps: 1` |
| reported flow: fill Product name, `scrollUntilVisible(Brand)`, tap Brand | Brand focused | `scrollUntilVisible` returns at once, the tap hits the footer, Product name keeps focus |
| reported flow, typed: `pressSequentially('Acme')` | Product name `Widget`, Brand `Acme` | Product name **`WidgetAcme`** (iOS: `Widget Acme`), Brand empty |
| reported flow, scrolling the form | Brand `Acme` | the scroll returns at once and the fill misses Brand |
| reported flow, filled: `fill('Acme')` | Product name `Widget`, Brand `Acme` | Android: Product name overwritten with **`Acme`**, reported as success |

`tests/control.e2e.ts` runs the same steps with the footer hidden, and passes, so the footer drawn over Brand is the only difference.

Evidence in `evidence/`:

- `android-stable-0.23.0.txt`, `ios-stable-0.23.0.txt`, `android-with-fix.txt`, `ios-with-fix.txt`: the CLI output of both suites, before and after the fix.
- `android-repro-nightly-*.txt`: an earlier run on the 0.23.1 nightly.
- `android-keyboard-open.png`: the layout with the keyboard up. Android's UI tree puts Brand at `[48,1396][1212,1540]`, inside the footer at `[0,1348][1260,1684]`.
- `android-typed-widgetacme.png`, `android-filled-overwrote-product.png`, `android-repro-typed-and-filled.mp4`: the typed and filled tests on 0.23.0.
- `ios-launch.png`: the screen on the iOS simulator.

## Where it comes from

- `@e2e-dev/mobile` marks a node hidden only when the device reports `visibleToUser === false`. agent-device works out visibility from the viewport, not from views drawn on top.
- agent-device has its own occlusion pass (`interactionBlocked: 'covered'`), but it counts only known floating chrome (tab bars, toolbars, sheets, dialogs), so an app-drawn footer isn't flagged.
- With the keyboard up, agent-device's screen swipe starts in the middle of the space above the keyboard, which is where the raised footer is, so the swipe moves nothing.
