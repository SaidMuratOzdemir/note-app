# Daily Note App

React Native daily note taking app built with Expo.

This repo avoids bundling binary image assets for icons. The configuration uses
remote image URLs in `app.json` so the project can be shared as text-only.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```
   This will display a QR code in the terminal. Scan it with the **Expo Go** app on your phone to run the app.

## Project Structure

- `src/components` – Reusable UI components
- `src/screens` – App screens (Home, New Note, Detail)
- `src/services` – AsyncStorage helpers
- `src/navigation` – Navigation stack

Notes are stored locally on the device using `AsyncStorage`.
