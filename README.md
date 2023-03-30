# Nft owner
Do you know a nft can own an other nft ?

A nft smartcontract just needs to respect an interface (ERC-721 or ERC1155 for EVM blockchains) to be consider as nft, but you can build anything on top of it.


## Install 
yarn install

## Launch test
npx hardhat test

## Compile
npx hardhat compile

## hardhat default command

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```