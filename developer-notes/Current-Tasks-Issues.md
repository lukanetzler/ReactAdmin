<!-- fullWidth: false tocVisible: false tableWrap: true -->
**__Developer Notes__**

**Tasks/Future Implementations**

- Onboarding Extension
  - Users who enter for the first time should experience an onboarding tutorial to let them get to know their app. This is likely a new set of screens that will demonstrate the expected usage.
    - Potential Integrations
      - App Starts: Check local storage for hasSeenTutorial.  If Null/False: Show the Tutorial/Onboarding screens.  If True: Go straight to the Home/Login screen.  On Tutorial Completion: Set hasSeenTutorial to true in storage so it never shows again.  The Best Tools for the Job (2026) For the Storage (The "Memory") You need a way to save that "one-time" flag.  React Native MMKV: The gold standard in 2026. it's significantly faster than the old AsyncStorage and works synchronously, meaning no "flicker" while the app waits to check the flag.\
        \\

Code revenue cat payment page - maybe bottom card - swipe ip aesthetic, like in the other sections of the app?

1. **When wiring Capacitor**, override `onRenderProcessGone` in the Android `MainActivity` to reload the WebView instead of letting Android show the system crash page. (Default behavior is the "Failed to Load Page" screen you saw.)
2. **Don't ship `server.url` pointing at `localhost:5173`** in `capacitor.config.json` for production builds — common foot-gun that produces exactly this error in TestFlight/Play Store builds if a dev forgot to remove it.

With the beta setup, **nothing about your current `npm run deploy` changes** — it still deploys to GitHub Pages as before. The Cloudflare beta deployment is completely separate and triggered automatically by GitHub whenever you push to the `beta` branch. You'd never need to run a manual deploy command for it.

So your workflow stays:

- `npm run deploy` → GitHub Pages (dev team, as now)
- `git push origin beta` → Cloudflare auto-builds and deploys to `beta.prayvail.org`