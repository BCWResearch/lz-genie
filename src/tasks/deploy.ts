import { readdirSync } from 'fs';
import select, { Separator } from '@inquirer/select';
import { exec } from 'child_process';

const contractSelect = async () => {
    
    const currentDir =  __dirname;
    const rootDir = currentDir.split('/').slice(0, -2).join('/');
    const path = `${rootDir}/solidity-examples/deploy`;
    const files = readdirSync(path).filter(file => file.endsWith('.js'));
    const answer = await select({
        message: 'Which Contract do you want to deploy?\n',
        choices: files.map((name, idx) => {
            return [{
                name: `${idx + 1}. ${name.slice(0, -3)}`,
                value: name
            }, new Separator()]
        }).flat()
    });
    return answer;
}


const networkSelect = async () => {
    // const config = readFileSync('solidity-examples/hardhat.config.js', 'utf8');
    const networks = ['bsc-testnet', 'goerli', 'fuji']
    const answer = await select({
        message: 'Which Network do you want to deploy to?\n',
        choices: networks.map((name, idx) => {
            return [{
                name: `${idx + 1}. ${name}`,
                value: name
            }, new Separator()]
        }).flat()
    });
    return answer;

}

const run = async () => {
    const contractSelected = await contractSelect();
    // console.log(contractSelected);
    const networkSelected = await networkSelect();
    const currentDir =  __dirname;
    const rootDir = currentDir.split('/').slice(0, -2).join('/');
    const path = `${rootDir}/solidity-examples`;
    // console.log(networkSelected);
    exec(`yarn --cwd ${path} install`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        if (stderr) {
            console.error(stderr);
            return;
        }
        console.log(stdout);
    });
    exec(`yarn --cwd ${path} hardhat --network ${networkSelected} deploy --tags ${contractSelected.slice(0, -3)}`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        if (stderr) {
            console.error(stderr);
            return;
        }
        console.log(stdout);
    });
}

export {
    run
}