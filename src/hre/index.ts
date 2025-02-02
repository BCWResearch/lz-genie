import { task } from 'hardhat/config'
import { getEidsByNetworkName } from './utils/network'
import { DeployUtils } from '../utils/deploy';
import "@nomicfoundation/hardhat-ethers";
import { ethers } from 'ethers';
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';

task('lzgenie:configure:dvn', 'Setup DVN', async (_, hre) => {
    // compile contracts first
    await hre.run('compile');

    console.log('Setting up DVN from Genie')
    console.log('hre:', hre.version)
    const eidsByNetworks = Object.entries(getEidsByNetworkName(hre))

    console.log('eidsByNetworks', eidsByNetworks)

    const contracts = await DeployUtils.fetchDeployedContracts();
    console.log('contracts', contracts)
})

task('lzgenie:configure:trust', 'Setup Trust', async (params: { [key: string]: string }, hre) => {
    const { contract, source, target } = params;
    console.log(`Setting up Trust from LzGenie for ${contract} from ${source} to ${target}`);

    const contracts = await DeployUtils.fetchDeployedContracts();
    if (contracts[contract] === undefined) {
        console.warn('Contract not found')
        return;
    }
    const hreEthers = (hre as any)?.ethers as typeof ethers & HardhatEthersHelpers;
    if (!hreEthers) {
        console.error('Hardhat Ethers not loaded')
        return;
    }
    const eidsByNetworks = Object.entries(getEidsByNetworkName(hre));
    const factory = await hreEthers.getContractFactory(contract);
    const contractInstance = factory.attach(contracts[contract][source]);

    const remoteChainId = eidsByNetworks.find(([network, eid]) => network === target)?.[1]
    if (!remoteChainId) {
        console.error('Remote chain id not found')
        return;
    }
    const remoteAndLocal = hreEthers.utils.solidityPack(["address", "address"], [contracts[contract][target], contractInstance.address]);

    if (contractInstance.setTrustedRemote) {
        console.log('Setting up trust bridge using setTrustedRemote');
        // concat remote and local address
        const isTrustedRemoteSet = await contractInstance.isTrustedRemote(remoteChainId, remoteAndLocal);
        if (!isTrustedRemoteSet) {
            try {
                let tx = await (await contractInstance.setTrustedRemote(remoteChainId, remoteAndLocal)).wait()
                console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
                console.log(` tx: ${tx.transactionHash}`)
            } catch (e) {
                if (e.error.message.includes("The chainId + address is already trusted")) {
                    console.log("*source already set*")
                } else {
                    console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
                }
            }
        } else {
            console.log("*source already set*")
        }
    } else if (contractInstance.setPeer) {
        console.log('Setting up trust bridge using setPeer');
        const paddedtarget = ethers.utils.zeroPad(contracts[contract][target], 32);
        const isPeerSet = await contractInstance.isPeer(remoteChainId, paddedtarget);
        if (!isPeerSet) {
            try {
                let tx = await (await contractInstance.setPeer(remoteChainId, paddedtarget)).wait()
                console.log(`✅ [${hre.network.name}] setPeer(${remoteChainId}, ${paddedtarget})`)
                console.log(` tx: ${tx.transactionHash}`)
            } catch (e) {
                if (e.error.message.includes("The chainId + address is already trusted")) {
                    console.log("*source already set*")
                } else {
                    console.log(`❌ [${hre.network.name}] setPeer(${remoteChainId}, ${paddedtarget})`)
                }
            }
        } else {
            console.log("*source already set*")
        }
    } else {
        console.error('Contract does not have a trust bridge method')
    }

})
    .addParam('source', 'The source network to bridge trust from')
    .addParam('target', 'The target network to bridge trust to')
    .addParam('contract', 'The contract to bridge trust for')

export default {}