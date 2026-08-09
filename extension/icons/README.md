# Icons

Week 4: add `icon16.png`, `icon48.png`, and `icon128.png` here, then add an
`icons` key to `manifest.json`:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

The key is deliberately left out of the manifest for now — Chrome refuses to
load an extension that references icon files that do not exist, so declaring
them before the PNGs are here would break `Load unpacked`.

Chrome Web Store submission requires all three sizes.
