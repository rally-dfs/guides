# RallyMobile SDK Claim Script

This script is used as a demo script to claim a Rally Mobile Tokens (pRLY or RLY). 
It is intended to be used in conjunction with the [Rally Mobile SDK](https://github.com/rally-dfs/rly-network-mobile-sdk)

> **NOTE:** This is meant to be setup with Polygon Mumbai Testnet.

## Requirements

Ensure that you have the following installed on your computer.

- NVM (`nvm install`) or Node `^18.8.0`

## Getting Started

### 1 - Clone Repository

First, clone the repo and install the dependencies:

```bash
git clone https://repo
```

### 2 - Install Dependencies

```bash
# FROM: ./rallysdk-claim-script

pnpm install; # or npm install
```

### 3 - Configure Environment Variables

Create a `.env` file in the root of the project and add the following:

```bash
# FROM: ./rallysdk-claim-script

cp .env.example .env;
```

Make sure to get your `RALLY_MOBILE_API_TOKEN`` from the [RallyProtocol Developer Dashboard](https://app.rallyprotocol.com/signup).

**File:** `./env`

```bash
RALLY_MOBILE_API_TOKEN="REPLACE_WITH_RALLY_MOBILE_API_TOKEN"s
WALLET_MNEMONIC=""
```

### 4 - Run Script & Set Mnemonic

Be sure to click the URLs at the end of the script to verify the transaction and address.

```bash
# FROM: ./rallysdk-claim-script

pnpm start; # or npm start

# [Expected Similar Output]:
# WALLET_MNEMONIC NOT FOUND - Generating New Mnemonic
# {
#   mnemonic: 'YOUR_RANDOMLY_GENERATED_MNEMONIC',
# }
# ...
# {
#   res: {
#     signedTx: '0x02f904d6830..
#     nonceGapFilled: {}
#   }
# }
# {
#   txHash: '0x6710b3ce6812787da41cf796b6a87cb492ddcba60cd8b99c27649d3e2d926117'
# }
# 
# SUCCESSFUL TX
# ========================================================
# 
# TX URL:
# https://mumbai.polygonscan.com/tx//0x6710b3ce6812787da41cf796b6a87cb492ddcba60cd8b99c27649d3e2d926117
# 
# ADDRESS URL:
# https://mumbai.polygonscan.com/address//0x3B09F24Eb14be08CE8fB45239F6076ab478A5A27
```

### 5 - Set Mnemonic

Copy the generated mnemonic and paste it into the `.env` file to keep the same wallet address.

**File:** `./env`

```bash
RALLY_MOBILE_API_TOKEN="REPLACE_WITH_RALLY_MOBILE_API_TOKEN"s
WALLET_MNEMONIC="YOUR_RANDOMLY_GENERATED_MNEMONIC"
```

## Troubleshooting & Debugging

These are typical errors to expect when running the script.

### Error - `execution reverted: Address has already received tokens.`

Rally is setup to distribute the tokens only once per address. If you have already claimed the tokens, you will receive this error.

If you'd like to try the script again to verify, just change the `WALLET_MNEMONIC` in the `.env` file to `""` generate a new wallet address.

