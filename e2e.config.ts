import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

/**
 * One target per platform. Pick one with `--target android` or `--target ios`
 * (the npm scripts do). The app must already be on the device: `npm run
 * android` or `npm run ios` builds a release build and installs it.
 *
 * Android: any connected device or emulator, or the one named in
 * ANDROID_DEVICE (a phone's model name, or an emulator serial).
 * iOS: the booted simulator, or the UDID in IOS_SIMULATOR_UDID.
 */
const APP_ID = 'dev.e2erepro.coveredinput';

export default {
  projectId: 'dev.e2erepro.covered-input',
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'android',
      engine: mobile({ platform: 'android', device: process.env.ANDROID_DEVICE || undefined }),
      app: { bundleId: APP_ID },
    },
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: process.env.IOS_SIMULATOR_UDID || undefined }),
      app: { bundleId: APP_ID },
    },
  ],
  reporters: ['list'],
} satisfies E2EConfig;
