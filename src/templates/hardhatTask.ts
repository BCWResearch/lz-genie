// taskTemplate.ts

export const taskTemplate = `
import * as fs from "fs";
import { task } from "hardhat/config";
import '@nomiclabs/hardhat-ethers';

task(
    "{{contractName}}:{{functionName}}",
    "Interact with {{contractName}}.{{functionName}}",
    async (taskArgs, hre) => {
        const deployedFile = \`deployments/\${hre.network.name}/{{contractName}}.json\`;
        
        if (!fs.existsSync(deployedFile)) {
            console.log(\`Deployment not found for \${hre.network.name} network\`);
            return;
        }
        
        const deploymentArtifact = fs.readFileSync(deployedFile, 'utf-8');
        const deploymentInfo = JSON.parse(deploymentArtifact);
        const contractAddress = deploymentInfo.address;

        console.log('Interacting with {{contractName}}.{{functionName}}');
        {{inputs}}

        const contractFactory = await hre.ethers.getContractFactory('{{contractName}}');
        const contract = contractFactory.attach(contractAddress);
        const result = await contract.{{functionName}}({{arguments}});
        console.log({ result });
    }
);

module.exports = task;
`;
