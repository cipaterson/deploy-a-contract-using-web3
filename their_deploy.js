require("dotenv").config();

const Web3 = require("web3");
const Tx = require("ethereumjs-tx").Transaction;
const BigNumber = require("bignumber.js");
//const stripHexPrefix = require('strip-hex-prefix');

async function main() {
  const network = process.env.ETHEREUM_NETWORK;
  const url = `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`;
  const web3Provider = new Web3.providers.HttpProvider(url);
  const web3 = new Web3(web3Provider);

  const owner = process.env.SIGNER_ACCOUNT;

  const o_key = new Buffer.from(process.env.SIGNER_PRIVATE_KEY, "hex");

  // var hAbi =require('./contracts/bin/X_abi.json');
  // var binary =require('./contracts/bin/X_bin.json');
  const fs = require("fs");
  const { abi: hAbi, bytecode: binary } = JSON.parse(
    fs.readFileSync("Demo.json")
  );

  var contract = new web3.eth.Contract(hAbi);
  const data = contract.deploy({ data: binary });
  console.log(await data.estimateGas());

  web3.eth.getTransactionCount(owner, (err, txCount) => {
    console.log("txCount=", txCount);

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(165000),
      gasPrice: web3.utils.toHex(15000000000),
      data: data.encodeABI(),
    };
    const common = require("ethereumjs-common");
    const custom_chain = common.default.forCustomChain(
      "mainnet",
      {
        name: "arbitrum-rinkeby",
        networkId: 421611,
        chainId: 421611,
      },
      "petersburg"
    );

    const tx = new Tx(txObject, { common: custom_chain });
    tx.sign(o_key);

    console.log("tx=", tx);

    const serializeTx = tx.serialize();
    const raw = "0x" + serializeTx.toString("hex");

    web3.eth.sendSignedTransaction(raw).on("receipt", console.log);
  });
}

main();
