import { task } from 'hardhat/config'
import { getEidsByNetworkName } from './utils/network'
import { DeployUtils } from '../utils/deploy';


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

export default {}