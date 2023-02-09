const {
  Client,
  ContractExecuteTransaction,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  ContractCallQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

let contractCompiled = require("./LookupContract.json");
const bytecode = contractCompiled.bytecode;

//Grab your Hedera testnet account ID and private key from your .env file
const myAccountId = process.env.CLIENT_ID;
const myPrivateKey = process.env.CLIENT_PRIVATE_KEY;

// If we weren't able to grab it, we should throw a new error
if (myAccountId == null || myPrivateKey == null) {
  throw new Error(
    "Environment variables myAccountId and myPrivateKey must be present"
  );
}

// Create our connection to the Hedera network
// The Hedera JS SDK makes this really easy!
const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

async function main() {
  try {
    console.log("Deploy contract");
    //Create the transaction
    const contractCreate = new ContractCreateFlow()
      .setGas(100000)
      .setBytecode(bytecode)
      .setConstructorParameters(
        new ContractFunctionParameters().addString("Alice").addUint256(123456)
      );

    //Sign the transaction with the client operator key and submit to a Hedera network
    const txResponse = contractCreate.execute(client);

    //Get the receipt of the transaction
    const receipt = (await txResponse).getReceipt(client);

    //Get the new contract ID
    const contractId = (await receipt).contractId;

    console.log("The new contract ID is " + contractId);

    console.log("Adding new data");
    //Create the transaction to update the contract message
    const contractExecTx1 = new ContractExecuteTransaction()
      .setContractId(contractId) //Set the ID of the contract
      .setGas(100000) //Set the gas for the contract call
      .setFunction(
        "setMobileNumber",
        new ContractFunctionParameters().addString("Bob").addUint256("789012")
      );

    //Submit the transaction to a Hedera network and store the response
    const contractCallResult = await contractExecTx1.execute(client);

    const record = await contractCallResult.getReceipt(client);
    console.log("Execution status : " + JSON.stringify(record.status));

    console.log("Reading stored data");

    const query = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction(
        "getMobileNumber",
        new ContractFunctionParameters().addString("Alice")
      );

    //Sign with the client operator private key to pay for the query and submit the query to a Hedera network
    const contractQuerySubmit = await query.execute(client);
    const contractQueryResult = contractQuerySubmit.getUint256();
    console.log("Alice value: " + contractQueryResult);

    process.exit();
  } catch (err) {
    console.log("Error :" + err);
  }
}

main();
