// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'

import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import 'lzgenie/bin/hre';
import './tasks'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
        ? [PRIVATE_KEY]
        : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        sepolia: {
            eid: EndpointId.SEPOLIA_V2_TESTNET,
            url: process.env.RPC_URL_SEPOLIA || 'https://rpc.sepolia.org/',
            accounts,
        },
        fuji: {
            eid: EndpointId.AVALANCHE_V2_TESTNET,
            url: process.env.RPC_URL_FUJI || 'https://rpc.ankr.com/avalanche_fuji',
            accounts,
        },
        mumbai: {
            eid: EndpointId.POLYGON_V2_TESTNET,
            url: process.env.RPC_URL_MUMBAI || 'https://rpc.ankr.com/polygon_mumbai',
            accounts,
        },
        ethereum: {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            url: process.env.RPC_URL_ETHEREUM || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
            accounts,
        },
        bsc: {
            eid: EndpointId.BSC_V2_MAINNET,
            url: process.env.RPC_URL_BSC || 'https://bsc-dataseed.binance.org/',
            accounts,
        },
        avalanche: {
            eid: EndpointId.AVALANCHE_V2_MAINNET,
            url: process.env.RPC_URL_AVALANCHE || 'https://api.avax.network/ext/bc/C/rpc',
            accounts,
        },
        polygon: {
            eid: EndpointId.POLYGON_V2_MAINNET,
            url: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com/',
            accounts,
        },
        arbitrum: {
            eid: EndpointId.ARBITRUM_V2_MAINNET,
            url: process.env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
            accounts,
        },
        optimism: {
            eid: EndpointId.OPTIMISM_V2_MAINNET,
            url: process.env.RPC_URL_OPTIMISM || 'https://mainnet.optimism.io',
            accounts,
        },
        fuse: {
            eid: EndpointId.FUSE_V2_MAINNET,
            url: process.env.RPC_URL_FUSE || 'https://rpc.fuse.io',
            accounts,
        },
        astar: {
            eid: EndpointId.ASTAR_V2_MAINNET,
            url: process.env.RPC_URL_ASTAR || 'https://rpc.astar.network',
            accounts,
        },
        zksync: {
            eid: EndpointId.ZKSYNC_V2_MAINNET,
            url: process.env.RPC_URL_ZKSYNC || 'https://mainnet.era.zksync.io',
            accounts,
        },
        klaytn: {
            eid: EndpointId.KLAYTN_V2_MAINNET,
            url: process.env.RPC_URL_KLAYTN || 'https://public-node-api.klaytnapi.com/v1/cypress',
            accounts,
        },
        metis: {
            eid: EndpointId.METIS_V2_MAINNET,
            url: process.env.RPC_URL_METIS || 'https://andromeda.metis.io/?owner=1088',
            accounts,
        },
        coredao: {
            eid: EndpointId.COREDAO_V2_MAINNET,
            url: process.env.RPC_URL_COREDAO || 'https://rpc.coredao.org',
            accounts,
        },
        meter: {
            eid: EndpointId.METER_V2_MAINNET,
            url: process.env.RPC_URL_METER || 'https://rpc.meter.io',
            accounts,
        },
        moonriver: {
            eid: EndpointId.MOONRIVER_V2_MAINNET,
            url: process.env.RPC_URL_MOONRIVER || 'https://rpc.moonriver.moonbeam.network',
            accounts,
        },
        scroll: {
            eid: EndpointId.SCROLL_V2_MAINNET,
            url: process.env.RPC_URL_SCROLL || 'https://scroll.io/rpc',
            accounts,
        },
        kava: {
            eid: EndpointId.KAVA_V2_MAINNET,
            url: process.env.RPC_URL_KAVA || 'https://evm.kava.io',
            accounts,
        },
        tenet: {
            eid: EndpointId.TENET_V2_MAINNET,
            url: process.env.RPC_URL_TENET || 'https://rpc.tenet.org',
            accounts,
        },
        canto: {
            eid: EndpointId.CANTO_V2_MAINNET,
            url: process.env.RPC_URL_CANTO || 'https://canto.rpc.thirdweb.com',
            accounts,
        },
        orderly: {
            eid: EndpointId.ORDERLY_V2_MAINNET,
            url: process.env.RPC_URL_ORDERLY || 'https://rpc.orderly.org',
            accounts,
        },
        meritcircle: {
            eid: EndpointId.MERITCIRCLE_V2_MAINNET,
            url: process.env.RPC_URL_MERITCIRCLE || 'https://rpc.meritcircle.io',
            accounts,
        },
        mantle: {
            eid: EndpointId.MANTLE_V2_MAINNET,
            url: process.env.RPC_URL_MANTLE || 'https://rpc.mantlenetwork.io',
            accounts,
        },
        zora: {
            eid: EndpointId.ZORA_V2_MAINNET,
            url: process.env.RPC_URL_ZORA || 'https://mainnet.rpc.zora.co',
            accounts,
        },
        tomo: {
            eid: EndpointId.TOMO_V2_MAINNET,
            url: process.env.RPC_URL_TOMO || 'https://rpc.tomochain.com',
            accounts,
        },
        loot: {
            eid: EndpointId.LOOT_V2_MAINNET,
            url: process.env.RPC_URL_LOOT || 'https://rpc.lootex.io',
            accounts,
        },
        telos: {
            eid: EndpointId.TELOS_V2_MAINNET,
            url: process.env.RPC_URL_TELOS || 'https://mainnet.telos.net',
            accounts,
        },
        aurora: {
            eid: EndpointId.AURORA_V2_MAINNET,
            url: process.env.RPC_URL_AURORA || 'https://mainnet.aurora.dev',
            accounts,
        },
        opbnb: {
            eid: EndpointId.OPBNB_V2_MAINNET,
            url: process.env.RPC_URL_OPBNB || 'https://rpc.opbnb.io',
            accounts,
        },
        shimmer: {
            eid: EndpointId.SHIMMER_V2_MAINNET,
            url: process.env.RPC_URL_SHIMMER || 'https://json-rpc.evm.shimmer.network',
            accounts,
        },
        conflux: {
            eid: EndpointId.CONFLUX_V2_MAINNET,
            url: process.env.RPC_URL_CONFLUX || 'https://main.confluxrpc.com',
            accounts,
        },
        eon: {
            eid: EndpointId.EON_V2_MAINNET,
            url: process.env.RPC_URL_EON || 'https://eon.rpc.eon.org',
            accounts,
        },
        xpla: {
            eid: EndpointId.XPLA_V2_MAINNET,
            url: process.env.RPC_URL_XPLA || 'https://dimension-lcd.xpla.dev',
            accounts,
        },
        manta: {
            eid: EndpointId.MANTA_V2_MAINNET,
            url: process.env.RPC_URL_MANTA || 'https://manta-rpc.manta.org',
            accounts,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
