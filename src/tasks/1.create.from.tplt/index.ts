import * as tasks from '..';
import { InquirerUtils } from "../../utils/inquirer"
import { ProjectSetupUtil } from '../../utils/projectsetup';

export default {
    tag: 'create.from.template',
    description: 'Create a New Project from a Template',
    run: async (_backCb: Function) => {
        InquirerUtils.handlePrompt({
            'onft1155': {
                description: 'Setup an ONFT1155 Project',
                tag: 'onft1155',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('onft1155');
                }
            },
            'onft721': {
                description: 'Setup an ONFT721 Project',
                tag: 'onft721',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('onft721');
                }
            },
            'oft': {
                description: 'Setup an OFT Project',
                tag: 'oft',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('oft');
                }

            },
            'proxyoft': {
                description: 'Setup a ProxyOft Project',
                tag: 'proxyoft',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('proxyoft');
                }

            },
            'proxyonft1155': {
                description: 'Setup a ProxyONFT1155 Project',
                tag: 'proxyonft1155',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('proxyonft1155');
                }

            },
            'oftv2': {
                description: 'Setup an OFTV2 Project',
                tag: 'oftv2',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('oftv2');
                }

            },
            'pingpong': {
                description: 'Setup a PingPong Project',
                tag: 'pingpong',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('pingpong');
                }
            },
            'omnicounter': {
                description: 'Setup an OmniCounter Project',
                tag: 'omnicounter',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('omnicounter');
                }
            },
        }, () => {
            InquirerUtils.handlePrompt(tasks.default);
        }, false, "Select a Template to Create a New Project:");
    }
};