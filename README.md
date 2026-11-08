# Reproduction: a covered TextInput reads as visible

For [tester-army/e2e#1324](https://github.com/tester-army/e2e/issues/1324).

Opening the keyboard raises a Back/Next footer over the Brand input. A person can't see or tap Brand, but e2e treats it as visible:

- `expect(brand).toBeHidden()` fails: "observed: visible".
- `screen.scrollUntilVisible(brand)` returns without scrolling.
- `brand.tap()`, `brand.pressSequentially()` and `brand.fill()` all report success, but the touch lands on the footer. Product name keeps focus, so the text goes into Product name.

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
npm run repro:android    # exits 1: all 5 repro tests fail
npm run control:android  # exits 0: both controls pass
```

iOS (a booted simulator). Clone to a path without spaces: React Native's "Bundle React Native code and images" build phase breaks on a space in the path.

```sh
npm run ios
npm run repro:ios
npm run control:ios
```

With more than one device connected, set `ANDROID_DEVICE` to the phone's model name, or `IOS_SIMULATOR_UDID`.

## Results

Android 16 (API 36), vivo I2220 phone, Gboard. `e2e` 0.23.0, `@e2e-dev/mobile` 0.12.6, `agent-device` 0.21.36. Expo SDK 57, React Native 0.86.3. Same result on every run.

`tests/repro.e2e.ts`: all 5 fail.

| Test | Expected | Observed |
|---|---|---|
| a TextInput under the footer reads as hidden | hidden | `visible (match count 1)` |
| a tap on the covered Brand input focuses it | Brand focused | not focused. The tap passed, and the screen shows `Footer taps: 1` |
| reported flow: fill Product name, `scrollUntilVisible(Brand)`, tap Brand | Brand focused | `scrollUntilVisible` returned in ~0.7s with no swipe. The tap hit the footer, and Product name kept focus |
| reported flow, typed: `pressSequentially('Acme')` | Product name `Widget`, Brand `Acme` | Product name **`WidgetAcme`**, Brand empty |
| reported flow, filled: `fill('Acme')` | Product name `Widget`, Brand `Acme` | Product name **`Acme`** (overwritten), Brand empty |

In each case the e2e step itself reports success: `tap textbox "Brand"`, `focus textbox "Brand"`, `fill textbox "Brand"`. Only the assertion after it fails.

The nightly gives the same result: `e2e` 0.23.1-nightly-20261108030229 and `@e2e-dev/mobile` 0.12.7-nightly-20261108030229 (all 5 fail, both controls pass; `evidence/android-repro-nightly-output.txt`). The only mobile change on `main` since that nightly is a config check (#1619).

`tests/control.e2e.ts`: both pass. With the footer hidden, the same steps fill Brand, so the footer drawn over Brand is the only difference.

Evidence in `evidence/`:

- `android-repro-output.txt`, `android-control-output.txt`: the CLI output.
- `android-repro-steps.txt`: each step, with the screen changes e2e recorded after it.
- `android-keyboard-open.png`: the layout with the keyboard up. Android's UI tree puts Brand at `[48,1396][1212,1540]`, inside the footer at `[0,1348][1260,1684]`.
- `android-typed-widgetacme.png`, `android-filled-overwrote-product.png`: the end state of the typed and filled tests.
- `android-repro-typed-and-filled.mp4`: screen recording of those two tests.

## Where it comes from

Read in the source, not confirmed by changing it:

- `@e2e-dev/mobile` marks a node hidden only when the device reports `visibleToUser === false` (`packages/mobile/src/nodes.ts`). `isNodeVisible` checks only that flag (`packages/e2e/src/locator/engine.ts`).
- agent-device works out visibility from the viewport: whether the node's center is on screen, or inside its scroll container (`packages/contracts/src/snapshot-visibility.ts`). It does not check whether a sibling view drawn on top covers the node.
- So a node under an overlay reads as visible. `scrollUntilVisible` stops at once, and the tap goes to the node's center, where the footer is.
