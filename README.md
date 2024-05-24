# What is LayerZero
LayerZero is an open-source, immutable messaging protocol designed to facilitate the creation of omnichain, interoperable applications.

### Ecosystem
[1] <a href="https://layerzero.network/" target="_blank">Website</a>

[2] <a href="https://layerzeroscan.com/" target="_blank">LayerZero Explorer</a>

[3] <a href="https://docs.layerzero.network/v2/" target="_blank">Documentation</a>


# About LZGenie
LZ Genie is <a href="https://www.bcw.group/" target="_blank">BCW</a>'s LayerZero quickstart guide. It helps oApp teams leverage the LayerZero protocol, and is specially designed for oApp teams that need an efficient, yet secure path to interoperability.

Before you start, become familiar with some terminology that will help you develop with Layerzero.
This of LzGenie as a set of boilerplate, scaffolding and ready to use tools to get a dev up and running quickly on usecases and quickly unleashing the power of LayerZero onto your applications.

# Getting Started

## Prerequisites

- Node.js > 18.20.0
- yarn

```bash
npm install -g yarn
```

## Use LzGenie

```bash 
npx lzgenie@latest
```


# Development

```bash
yarn install
```

## Run Locally

```bash
yarn install:local
lzgenie
```

## Development

```bash
yarn start
```

```bash
 ██╗     ███████╗    ██████╗ ███████╗███╗   ██╗██╗███████╗
 ██║     ╚══███╔╝   ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝
 ██║       ███╔╝    ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗  
 ██║      ███╔╝     ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝  
 ███████╗███████╗   ╚██████╔╝███████╗██║ ╚████║██║███████╗
 ╚══════╝╚══════╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝

? What do you want to do?

❯ 1. Create a New Project from a Template
  2. Create an empty OApp Project
  3. Deploy a Project
  4. Add or Remove Modules
  5. Interact with an Existing Project
  ❌ Exit
```

# More about LayerZero

### What is a DVN?
You will find the DVN term used in layerzero often.A Decentralized Verifier Network (DVN) is an entity responsible for verifying messages sent across chains by applications that use LayerZero. An application’s DVN configuration is a critical part of the security stack used to secure the integrity of the LayerZero protocol and of each message that it facilitates transmission of across chains. 
<a href="https://medium.com/layerzero-official/layerzero-v2-explaining-dvns-02e08cce4e80" target="_blank">Read more here.</a>


### L0 V1 vs V2
LayerZeroV2 is live on 40+ networks and testnets. It creates an omnichain network of blockchains for developers to build universal applications. V2 introduced DVN’s and the Security Stack, adapters, the modular approach X of Y of N, and several other upgrades to functionality and security on LayerZero. 
<a href="https://medium.com/layerzero-official/introducing-layerzero-v2-076a9b3cb029" target="_blank">Read more here.</a>


### What is a Smart Contract
What is a Smart Contract?
A smart contract is a program that runs similarly to traditional contracts, but which is executed as code running on a blockchain such as Ethereum or one of its layer-2 networks. Smart contracts allows developers to build apps that take advantage of blockchain security, reliability, and other benefits while facilitating various peer-to-peer functionalities.
<a href="https://www.coinbase.com/en-gb/learn/crypto-basics/what-is-a-smart-contract" target="_blank"> 
Read more here.</a>


### Open Zepellin Interface
OpenZeppelin is an open-source platform for building secure dApps. The framework provides the required tools to create and automate Web3 applications. In addition, companies of any size can refer to OpenZeppelin’s audit services to find the best practices in the industry. Furthermore, OpenZeppelin has big names such as the Ethereum Foundation and Coinbase among its customers. It provides security, reliability, and risk management for Ethereum projects and has the mission of “protecting the open economy”. It conducts security audits on your demand and implements security measures to ensure that your dApps are secure. After recognizing the potential problems in the code, they provide a report containing best practices and recommendations to remove the weaknesses in the system.
Find more info <a href="https://moralis.io/what-is-openzeppelin-the-ultimate-guide/">here</a>

<a href="https://www.openzeppelin.com/" target="_blank">Website</a>

<a href="https://github.com/OpenZeppelin/openzeppelin-contracts" target="_blank">Github</a>

<a href="https://wizard.openzeppelin.com/#erc721" target="_blank">Online Wizard</a>
