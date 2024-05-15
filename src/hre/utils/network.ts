import { EndpointId } from '@layerzerolabs/lz-definitions'


import { Environment as HardhatRuntimeEnvironmentImplementation } from 'hardhat/internal/core/runtime-environment'
import { HardhatContext } from 'hardhat/internal/context'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const formatEid = (eid: EndpointId): string => EndpointId[eid] ?? `Unknown EndpointId (${eid})`

export const getEidsByNetworkName = (hre: HardhatRuntimeEnvironment): Record<string, EndpointId | undefined> => {
    // First we get the network name -> network config pairs
    const networkEntries = Object.entries(hre.config.networks) as any
    // And map the network config to an endpoint ID
    const eidEntries = networkEntries.map(
        ([networkName, networkConfig]) => [networkName, networkConfig.eid] as const
    )
    // Now we turn the entries back into a record
    const eidsByNetworkName = Object.fromEntries(eidEntries)

    // Now we check that the user has not configured the endpoint ID mapping incorrectly
    // (i.e. there are more networks configured with the same endpoint ID)
    //
    // For this we'll drop all the networks whose endpoint IDs are not defined
    const eidEntriesWithDefinedEid = eidEntries.filter(([_, eid]) => eid != null)
    const definedEidsByNetworkName = Object.fromEntries(eidEntriesWithDefinedEid)

    // Now we grab the sets of unique network names and endpoint IDs
    const allDefinedEids = new Set(Object.values(definedEidsByNetworkName))
    const allNetworkNames = new Set(Object.keys(definedEidsByNetworkName))

    // If the number of unique networks matches the number of unique endpoint IDs, there are no duplicates
    if (allDefinedEids.size === allNetworkNames.size) {
        return eidsByNetworkName
    }

    // At this point the number of defined endpoint IDs can only be lower than
    // the number of defined network names (since network names are taken from the keys
    // of an object and endpoint IDs from its values)
    //
    // To let the user know whihc networks to fix, we need to grab all the ones that
    // have been duplicated
    //
    // We are not claiming any efficiency of this algorithm as we don't expect any large numbers of networks
    const duplicatedNetworkNames = Array.from(allDefinedEids)
        // First we grab all the network names with this endpoint ID
        .map((eid) =>
            eidEntriesWithDefinedEid.flatMap(([networkName, definedEid]) =>
                eid === definedEid ? [networkName] : []
            )
        )
        // Then we find all the network names listed more than once
        .filter((networkNames) => networkNames.length > 1)

    // Now we let the user know which network names have identical endpoint IDs
    const messages = duplicatedNetworkNames
        .map(
            (networkNames) =>
                `- ${networkNames.join(', ')} have eid set to ${formatEid(eidsByNetworkName[networkNames[0]!]!)}`
        )
        .join('\n')

    throw new Error(
        `Found multiple networks configured with the same 'eid':\n\n${messages}\n\nPlease fix this in your hardhat config.`
    )
}

export const getDefaultContext = (): HardhatContext => {
    // Context is registered globally as a singleton and can be accessed
    // using the static methods of the HardhatContext class
    //
    // In our case we require the context to exist, the other option would be
    // to create it and set it up - see packages/hardhat-core/src/register.ts for an example setup
    try {
        return HardhatContext.getHardhatContext()
    } catch (error: unknown) {
        throw new Error(`Could not get Hardhat context: ${error}`)
    }
}
export const getDefaultRuntimeEnvironment = (): HardhatRuntimeEnvironment => {
    // The first step is to get the hardhat context
    const context = getDefaultContext()

    // We require the hardhat environment to already exist
    //
    // Again, we could create it but that means we'd need to duplicate the bootstrap code
    // that hardhat does when setting up the environment
    try {
        return context.getHardhatRuntimeEnvironment()
    } catch (error: unknown) {
        throw new Error(`Could not get Hardhat Runtime Environment: ${error}`)
    }
}


export const getHreByNetworkName: any = async (networkName: any) => {
    const context = getDefaultContext()
    const environment = getDefaultRuntimeEnvironment()

    try {
        // The last step is to create a duplicate enviornment that mimics the original one
        // with one crucial difference - the network setup
        return new HardhatRuntimeEnvironmentImplementation(
            environment.config,
            {
                ...environment.hardhatArguments,
                network: networkName,
            },
            environment.tasks,
            environment.scopes,
            context.environmentExtenders,
            context.experimentalHardhatNetworkMessageTraceHooks,
            environment.userConfig,
            context.providerExtenders
            // This is a bit annoying - the environmentExtenders are not stronly typed
            // so TypeScript complains that the properties required by HardhatRuntimeEnvironment
            // are not present on HardhatRuntimeEnvironmentImplementation
        ) as unknown as HardhatRuntimeEnvironment
    } catch (error: unknown) {
        throw new Error(`Could not setup Hardhat Runtime Environment: ${error}`)
    }
}