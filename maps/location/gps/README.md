# Expo GPS adapter

This adapter is intentionally limited to foreground, current-location GPS access.

- Permission: request foreground location permission only.
- Accuracy: `HIGH_ACCURACY` when accuracy is 20 meters or better; otherwise `LOW_ACCURACY`.
- Scope: current position only. There is no background permission request and no continuous tracking/watchPosition yet.
- Safety: invalid coordinates or unavailable services return `UNAVAILABLE` and do not crash the app.
