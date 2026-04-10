<!-- fullWidth: false tocVisible: false tableWrap: true -->
**__Developer Notes__**

**Current Issues**

- Guest User Flow
  - All previous changes work well however, when the guest user decides they want to start saving their details, and click create account in the profile screen - it takes them back to the very start of the app, the begin your path/ return screen instead of taking them where they should go
    - Thus "create your free account" is a little broken, likely a minor fix.\\

---

**Tasks/Future Implementations**

- Onboarding Extension
  - Users who enter for the first time should experience an onboarding tutorial to let them get to know their app. This is likely a new set of screens that will demonstrate the expected usage.
    - Potential Integrations
      - App Starts: Check local storage for hasSeenTutorial.  If Null/False: Show the Tutorial/Onboarding screens.  If True: Go straight to the Home/Login screen.  On Tutorial Completion: Set hasSeenTutorial to true in storage so it never shows again.  The Best Tools for the Job (2026) For the Storage (The "Memory") You need a way to save that "one-time" flag.  React Native MMKV: The gold standard in 2026. it's significantly faster than the old AsyncStorage and works synchronously, meaning no "flicker" while the app waits to check the flag.