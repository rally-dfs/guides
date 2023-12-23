// Imports
// ========================================================
import { BigNumber, ethers, providers } from "ethers";
import {
  AccountKeypair,
  GsnTransactionDetails,
  PrefixedHexString,
} from "@rly-network/mobile-sdk/src/gsnClient/utils";
import { TypedGsnRequestData } from "@rly-network/mobile-sdk/src/gsnClient/EIP712/typedSigning";
import { RelayRequest } from "@rly-network/mobile-sdk/src/gsnClient/EIP712/RelayRequest";
import { NetworkConfig } from "@rly-network/mobile-sdk/src/network_config/network_config";
import * as forwarderAbi from "@rly-network/mobile-sdk/src/gsnClient/ABI/IForwarder.json";
import * as relayHubAbi from "@rly-network/mobile-sdk/src/gsnClient/ABI/IRelayHub.json";

// Types
// ========================================================
export interface GsnServerConfigPayload {
  relayWorkerAddress: string;
  relayManagerAddress: string;
  relayHubAddress: string;
  ownerAddress: string;
  minMaxPriorityFeePerGas: string;
  maxMaxFeePerGas: string;
  minMaxFeePerGas: string;
  maxAcceptanceBudget: string;
  chainId: string;
  networkId: string;
  ready: boolean;
  version: string;
}

// Helpers
// ========================================================
/**
 *
 * @param relayRequest
 * @param domainSeparatorName
 * @param chainId
 * @param account
 * @returns
 */
export const signRequest = async (
  relayRequest: RelayRequest,
  domainSeparatorName: string,
  chainId: string,
  account: AccountKeypair
) => {
  const cloneRequest = { ...relayRequest };

  const signedGsnData = new TypedGsnRequestData(
    domainSeparatorName,
    Number(chainId),
    relayRequest.relayData.forwarder,
    cloneRequest
  );

  const wallet = new ethers.Wallet(account.privateKey);

  const types = {
    RelayData: [...signedGsnData.types.RelayData],
    RelayRequest: [...signedGsnData.types.RelayRequest],
  };

  const signature = await wallet._signTypedData(
    signedGsnData.domain,
    types,
    signedGsnData.message
  );

  return signature;
};

/**
 *
 * @param relayRequest
 * @param signature
 * @returns
 */
export const getRelayRequestID = (
  relayRequest: any,
  signature: PrefixedHexString = "0x"
): PrefixedHexString => {
  const types = ["address", "uint256", "bytes"];
  const parameters = [
    relayRequest.request.from,
    relayRequest.request.nonce,
    signature,
  ];

  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(types, parameters)
  );
  const rawRelayRequestId = hash.replace(/^0x/, "").padStart(64, "0");

  const prefixSize = 8;
  const prefixedRelayRequestId = rawRelayRequestId.replace(
    new RegExp(`^.{${prefixSize}}`),
    "0".repeat(prefixSize)
  );
  return `0x${prefixedRelayRequestId}`;
};

/**
 *
 * @param calldata
 * @returns
 */
export const calculateCalldataBytesZeroNonzero = (
  calldata: PrefixedHexString
): { calldataZeroBytes: number; calldataNonzeroBytes: number } => {
  const calldataBuf = Buffer.from(calldata.replace("0x", ""), "hex");
  let calldataZeroBytes = 0;
  let calldataNonzeroBytes = 0;
  calldataBuf.forEach((ch) => {
    ch === 0 ? calldataZeroBytes++ : calldataNonzeroBytes++;
  });
  return { calldataZeroBytes, calldataNonzeroBytes };
};

/**
 *
 * @param msgData
 * @param gtxDataNonZero
 * @param gtxDataZero
 * @returns
 */
export const calculateCalldataCost = (
  msgData: PrefixedHexString,
  gtxDataNonZero: number,
  gtxDataZero: number
): number => {
  const { calldataZeroBytes, calldataNonzeroBytes } =
    calculateCalldataBytesZeroNonzero(msgData);
  return (
    calldataZeroBytes * gtxDataZero + calldataNonzeroBytes * gtxDataNonZero
  );
};

/**
 *
 * @param transaction
 * @param gtxDataNonZero
 * @param gtxDataZero
 * @returns
 */
export const estimateGasWithoutCallData = (
  transaction: GsnTransactionDetails,
  gtxDataNonZero: number,
  gtxDataZero: number
) => {
  const originalGas = transaction.gas;
  const callDataCost = calculateCalldataCost(
    transaction.data,
    gtxDataNonZero,
    gtxDataZero
  );
  const adjustedgas = BigNumber.from(originalGas).sub(callDataCost);
  return adjustedgas.toHexString();
};

/**
 *
 * @param transaction
 * @param config
 * @param account
 * @param web3Provider
 * @returns
 */
export const buildRelayRequest = async (
  transaction: GsnTransactionDetails,
  config: NetworkConfig,
  account: AccountKeypair,
  web3Provider: providers.JsonRpcProvider
) => {
  //remove call data cost from gas estimate as tx will be called from contract
  transaction.gas = estimateGasWithoutCallData(
    transaction,
    config.gsn.gtxDataNonZero,
    config.gsn.gtxDataZero
  );

  const secondsNow = Math.round(Date.now() / 1000);
  const validUntilTime = (
    secondsNow + config.gsn.requestValidSeconds
  ).toString();

  const forwarder = new ethers.Contract(
    config.gsn.forwarderAddress,
    forwarderAbi,
    web3Provider
  );
  const nonce = await forwarder.getNonce(account.address);
  const senderNonce = nonce.toString();
  const relayRequest: RelayRequest = {
    request: {
      from: transaction.from,
      to: transaction.to,
      value: transaction.value || "0",
      gas: parseInt(transaction.gas, 16).toString(),
      nonce: senderNonce,
      data: transaction.data,
      validUntilTime,
    },
    relayData: {
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      transactionCalldataGasUsed: "",
      relayWorker: config.gsn.relayWorkerAddress,
      paymaster: config.gsn.paymasterAddress,
      forwarder: config.gsn.forwarderAddress,
      paymasterData: transaction.paymasterData?.toString() || "0x",
      clientId: "1",
    },
  };

  // protecting the original object from temporary modifications done here
  const relayRequestCopy = Object.assign({}, relayRequest, {
    relayData: Object.assign({}, relayRequest.relayData),
  });

  relayRequestCopy.relayData.transactionCalldataGasUsed = "0xffffffffff";
  relayRequestCopy.relayData.paymasterData =
    "0x" + "ff".repeat(config.gsn.maxPaymasterDataLength);
  const maxAcceptanceBudget = "0xffffffffff";
  const signature = "0x" + "ff".repeat(65);
  const approvalData = "0x" + "ff".repeat(config.gsn.maxApprovalDataLength);

  const relayHub = new ethers.Contract(config.gsn.relayHubAddress, relayHubAbi);

  const tx = await relayHub.populateTransaction.relayCall?.(
    config.gsn.domainSeparatorName,
    maxAcceptanceBudget,
    relayRequestCopy,
    signature,
    approvalData
  );
  if (!tx?.data) {
    throw "tx data undefined";
  }

  const transactionCalldataGasUsed = BigNumber.from(
    calculateCalldataCost(
      tx.data,
      config.gsn.gtxDataNonZero,
      config.gsn.gtxDataZero
    )
  ).toHexString();

  relayRequest.relayData.transactionCalldataGasUsed = parseInt(
    transactionCalldataGasUsed,
    16
  ).toString();

  return relayRequest;
};

/**
 *
 * @param relayRequest
 * @param config
 * @param account
 * @param web3Provider
 * @returns
 */
export const buildRelayHttpRequest = async (
  relayRequest: RelayRequest,
  config: NetworkConfig,
  account: AccountKeypair,
  web3Provider: providers.JsonRpcProvider
) => {
  const signature = await signRequest(
    relayRequest,
    config.gsn.domainSeparatorName,
    config.gsn.chainId,
    account
  );

  const approvalData = "0x";

  const wallet = new ethers.VoidSigner(
    relayRequest.relayData.relayWorker,
    web3Provider
  );
  const relayLastKnownNonce = await wallet.getTransactionCount();
  const relayMaxNonce = relayLastKnownNonce + config.gsn.maxRelayNonceGap;

  const metadata = {
    maxAcceptanceBudget: config.gsn.maxAcceptanceBudget,
    relayHubAddress: config.gsn.relayHubAddress,
    signature,
    approvalData,
    relayMaxNonce,
    relayLastKnownNonce,
    domainSeparatorName: config.gsn.domainSeparatorName,
    relayRequestId: "",
  };
  const httpRequest = {
    relayRequest,
    metadata,
  };

  return httpRequest;
};

/**
 *
 * @param res
 * @param provider
 * @returns
 */
export const handleGsnResponse = async (
  res: any,
  provider: ethers.providers.JsonRpcProvider
) => {
  const txHash = ethers.utils.keccak256(res.signedTx);
  await provider.waitForTransaction(txHash);
  return txHash;
};
