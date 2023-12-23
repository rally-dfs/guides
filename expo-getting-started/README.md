# RallyMobile SDK Expo Getting Started

This is a sample project to demonstrate how to use the RallyMobile SDK with Expo.

![RallyMobileSDK Expo Geting Started](./README/rallymobilesdk-expo-getting-started-app.png)

## Requirements

- NVM or NodeJS `v18.18.0` or higher
- MacOS with Xcode `v14.3.1` or higher
- Android Studio `Giraffe v2020.3.1 Patch 2` or higher & [Java](https://www.oracle.com/java/technologies/downloads/) `v21.0.1 2023-10-17 LTS` or higher

## Getting Started

> ℹ️ **NOTE:** Make sure to use `npm` for all commands, and there are some issues with `yarn` and `pnpm`

### 1 - Install Dependencies

```bash
# FROM: ./rallymobilesdk-expo-getting-started

npm install;
```

### 2 - Add Environment Variables

Make sure to get your API key from the [RallyProtocol Developer Dashboard](https://www.rallyprotocol.com).

```bash
# FROM: ./rallymobilesdk-expo-getting-started

cp ./private_config.example.ts ./private_config.ts;
```

**File:** `./private_config.ts`

```typescript
export const PrivateConfig = {
  RALLY_API_KEY: "YOUR_RALLY_API_TOKEN_HERE",
  RLY_TOKEN_ADDRESS_MUMBAI: "0x1C7312Cb60b40cF586e796FEdD60Cf243286c9E9",
};
```

### 3 - Prebuild App

Prebuild the app to ensure that the RallyMobile SDK is built correctly.

```bash
# FROM: ./rallymobilesdk-expo-getting-started

npm run build:ios;
```

### 4 - Run Application

```bash
npm run ios;
```


