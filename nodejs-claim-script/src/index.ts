// Imports
// ========================================================
import { ethers, Contract } from "ethers";
import { config } from "dotenv";
// Everything Rally Related
import { MumbaiNetworkConfig } from "@rly-network/mobile-sdk/src/network_config/network_config_mumbai";
import { PolygonNetworkConfig } from "@rly-network/mobile-sdk/src/network_config/network_config_polygon";
import { GsnTransactionDetails } from "@rly-network/mobile-sdk/src/gsnClient/utils";
import * as TokenFaucet from "@rly-network/mobile-sdk/src/contracts/tokenFaucetData.json";
import {
  GsnServerConfigPayload,
  buildRelayHttpRequest,
  buildRelayRequest,
  getRelayRequestID,
  handleGsnResponse,
} from "./utils/helpers";

// Config
// ========================================================
config();

// Constants
// ========================================================
const API_KEY = process.env.RALLY_MOBILE_API_TOKEN || "";
const MNEMNOIC = process.env.WALLET_MNEMONIC || "";
const BLOCK_EXPLORER = {
  mumbai: {
    tx: "https://mumbai.polygonscan.com/tx/",
    address: "https://mumbai.polygonscan.com/address/"
  },
  polygon: {
    tx: "https://polygonscan.com/tx/",
    address: "https://polygonscan.com/address/"
  }
};

// Main Script
// ========================================================
(async () => {
  try {
    // CHANGE this if you'd like to use mainnet to `PolygonNetworkConfig`
    const NETWORK_CONFIG = MumbaiNetworkConfig;

    if (!API_KEY || API_KEY === "YOUR_API_TOKEN") {
      throw "RALLY_MOBILE_API_TOKEN not set in .env file";
    }

    if (!MNEMNOIC) {
      console.log("WALLET_MNEMONIC NOT FOUND - Generating New Mnemonic");
    }

    // Generate Mnemonic if not set
    const mnemonic =
      MNEMNOIC.length > 1 
      ? MNEMNOIC
      : ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(32));
    console.log({ mnemonic });

    // Create Wallet from Mnemonic
    const account = ethers.Wallet.fromMnemonic(mnemonic);
    console.log({ account });

    // Provider Configuration
    const provider = new ethers.providers.JsonRpcProvider(
      NETWORK_CONFIG.gsn.rpcUrl
    );
    console.log({ provider });

    // Establish Token Faucet
    const tokenFaucet = new Contract(
      NETWORK_CONFIG.contracts.tokenFaucet,
      TokenFaucet.abi,
      provider
    );

    // Create Claim Tx - MetaTransaction
    const tx = await tokenFaucet.populateTransaction.claim?.({
      from: account.address,
    });
    console.log({ tx });

    // Estimate gas of Claim Tx - MetaTransaction
    const gas = await tokenFaucet.estimateGas.claim?.({
      from: account.address,
    });
    console.log({ gas });

    // Get Max Fee Per Gas and Max Priority Fee Per Gas
    const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();

    if (!tx) {
      throw "tx not populated";
    }

    // Format GSN Tx
    const gsnTx = {
      from: account.address,
      data: tx.data,
      value: "0",
      to: tx.to,
      gas: gas?._hex,
      maxFeePerGas: maxFeePerGas?._hex,
      maxPriorityFeePerGas: maxPriorityFeePerGas?._hex,
    } as GsnTransactionDetails;

    // Relay GSN Tx
    // 1. Build Relay Request
    const response = await fetch(
      `${MumbaiNetworkConfig.gsn.relayUrl}/getaddr`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY || ""}`,
        },
      }
    );
    const serverConfigUpdate =
      (await response.json()) as GsnServerConfigPayload;
    console.log({ serverConfigUpdate });

    // Update Mumbai Network Config With New Relay Worker Address
    const UpdatedMumbaiNetworkConfig = NETWORK_CONFIG;
    UpdatedMumbaiNetworkConfig.gsn.relayWorkerAddress =
      serverConfigUpdate.relayWorkerAddress;

    // Set Transaction Fees
    const serverSuggestedMinPriorityFeePerGas = parseInt(
      serverConfigUpdate.minMaxPriorityFeePerGas,
      10
    );
    const paddedMaxPriority = Math.round(
      serverSuggestedMinPriorityFeePerGas * 1.4
    );
    gsnTx.maxPriorityFeePerGas = paddedMaxPriority.toString();

    // Special handling for mumbai because of quirk with gas estimate returned by GSN for mumbai
    if (serverConfigUpdate.chainId === "80001") {
      gsnTx.maxFeePerGas = paddedMaxPriority.toString();
    } else {
      gsnTx.maxFeePerGas = serverConfigUpdate.maxMaxFeePerGas;
    }

    // 2. Create Relay Request
    const relayRequest = await buildRelayRequest(
      gsnTx,
      UpdatedMumbaiNetworkConfig,
      account,
      provider
    );
    console.log({ relayRequest });

    // 3. Create http Relay Request
    const httpRequest = await buildRelayHttpRequest(
      relayRequest,
      UpdatedMumbaiNetworkConfig,
      account,
      provider
    );

    const relayRequestId = getRelayRequestID(
      httpRequest.relayRequest,
      httpRequest.metadata.signature
    );

    httpRequest.metadata.relayRequestId = relayRequestId;

    console.log({ httpRequest });

    // 4. Perform Request
    const res = await fetch(
      `${UpdatedMumbaiNetworkConfig.gsn.relayUrl}/relay`,
      {
        method: "POST",
        body: JSON.stringify(httpRequest),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY || ""}`,
        },
      }
    );

    const jsonResult = await res.json()
    console.log({ res: jsonResult });

    // 5. Get Transaction Hash
    console.log('WAITING FOR TX TO COMPLETE...\n========================================================\n');
    const txHash = ethers.utils.keccak256(jsonResult.signedTx);
    await provider.waitForTransaction(txHash);
    console.log({ txHash });

    // 6. Display Link
    console.log('\n\nSUCCESSFUL TX\n========================================================\n');
    if (serverConfigUpdate.chainId === "80001") {
      console.log(
        `TX URL:\n${BLOCK_EXPLORER.mumbai.tx}/${txHash}\n\nADDRESS URL:\n${BLOCK_EXPLORER.mumbai.address}/${account.address}`
      );
      console.log()
    } else {
      console.log(
        `TX URL:\n${BLOCK_EXPLORER.polygon.tx}/${txHash}\n\ADDRESS URL:\n${BLOCK_EXPLORER.polygon.address}/${account.address}`
      );
    }
  } catch (error: any) {
    if (error?.reason) {
      console.log({ reason: error.reason });
    }
    console.group(
      "FULL ERROR\n========================================================"
    );
    console.log({ error });
    console.groupEnd();
  }
})();
