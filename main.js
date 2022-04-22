// https://docs.1inch.io/docs/aggregation-protocol/introduction
// https://github.com/1inch/1inchProtocol/issues/15

const Web3 = require("web3");
require("isomorphic-fetch");

// list of chains and chain ids -> https://chainlist.org/

const polygonMainnetId = 137;
const providerUrl =
  "https://polygon-mainnet.infura.io/v3/c3329fd1aa1f4ad0a85e96c09a6859ea";
const publiKey = "0xC43BD4aFBC00d9a6A1007b9e1Acd24824c7374f1";
const privateKey =
  "your_private_key_here";

const amount = 0.5 * 1e18;

const matic = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const dai = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";

const swapParams = {
  fromTokenAddress: dai,
  toTokenAddress: matic,
  amount: amount.toString(),
  fromAddress: publiKey,
  slippage: 0.5,
  disableEstimate: false,
  allowPartialFill: false,
};

const broadcastApiUrl = `https://tx-gateway.1inch.io/v1.1/${polygonMainnetId}/broadcast`;
const apiBaseUrl = `https://api.1inch.io/v4.0/${polygonMainnetId}`;

const web3 = new Web3(providerUrl);

function apiRequestUrl(methodName, queryParams) {
  return (
    apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString()
  );
}

/**
 * Checking if ERC-20 Token was given prior approval for transfer
 * Returns 0 if not
 */
const checkAllowance = async (tokenAddress, walletAddress) => {
  const res = await fetch(
    apiRequestUrl("/approve/allowance", { tokenAddress, walletAddress })
  );
  if (res.status == 200) {
    return (await res.json()).allowance;
  }
};

const broadCastRawTransaction = async (rawTransaction) => {
  const res = await fetch(broadcastApiUrl, {
    method: "post",
    body: JSON.stringify({ rawTransaction }),
    headers: { "Content-Type": "application/json" },
  });
  if (res.status == 200) {
    return (await res.json()).transactionHash;
  }
  console.log(res.status);
  console.log(await res.json());
};

const signAndSendTransaction = async (tx) => {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    tx,
    privateKey
  );
  return await broadCastRawTransaction(rawTransaction);
};

/**
 * Giving ERC-20 approval to 1inch
 */
const buildTxForApproveTradeWithRouter = async (tokenAddress, amount) => {
  const url = apiRequestUrl(
    "/approve/transaction",
    amount ? { tokenAddress, amount } : { tokenAddress }
  );
  const transaction = await (await fetch(url)).json();

  const gasLimit = await web3.eth.estimateGas({
    ...transaction,
    from: publiKey,
  });
  return { ...transaction, gas: gasLimit };
};

const buildTxForSwap = async (swapParams) => {
  const url = apiRequestUrl("/swap", swapParams);
  const res = await (await fetch(url)).json();
  return res.tx;
};

const main = async () => {
  const allowance = await checkAllowance(swapParams.fromTokenAddress, publiKey);
  if (allowance > 0) {
    const swapTransaction = await buildTxForSwap(swapParams);
    const swapTxHash = await signAndSendTransaction(swapTransaction);
    return swapTxHash;
  } else {
    const tx = await buildTxForApproveTradeWithRouter(
      swapParams.fromTokenAddress
    );
    const approveHash = await signAndSendTransaction(tx);
    return approveHash;
  }
};

main()
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
