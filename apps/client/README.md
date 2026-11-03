# LabelLog

LabelLog is the Expo client for the workspace. For project overview and
screenshots, see the [workspace README](../../README.md).

## Motivation

Apple Health provides a useful place to track nutrition data, but entering
every value from a food label by hand is tedious. LabelLog automates that
process: scan a product's barcode (or a nutrition label), review the extracted
values, and save them directly to Apple Health. Your nutrition history and
overview remain in the Health app, so you do not need a separate analytics or
tracking app.

The app has been tested on iOS 16.4 and later.

## Features

- Scan product barcodes and nutrition labels with the camera
- Extract nutrition values using (iOS native) OCR and an LLM
- Review values before saving them
- Choose which nutrients to write to Apple Health
- Keep the product catalog on the device in a local SQLite database

## Build on a device

From the workspace root, connect an iPhone and choose the Xcode configuration:

```sh
# Debug
pnpm --filter label-log-client exec expo run:ios --device --configuration Debug

# Release
pnpm --filter label-log-client exec expo run:ios --device --configuration Release
```

## Regenerate native projects

After changing `app.json` or adding, removing, or updating a native package,
install workspace dependencies and regenerate the native projects:

```sh
pnpm install
pnpm --filter label-log-client exec expo prebuild --clean --no-install
```

Then rebuild with either configuration above. `--clean` replaces the tracked
`ios` and `android` directories, so preserve any native changes that are not
represented by `app.json` or config plugins before running it. For JavaScript-only
package changes, `pnpm install` is enough; a native prebuild is not needed.

## Backend

The app uses the server in `../server` for user authentication and
LLM-powered nutrition-label extraction. See its [README](../server/README.md)
for setup.
