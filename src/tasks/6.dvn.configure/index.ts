import { DVNUtils } from "../../utils/dvn";
import { InquirerUtils } from "../../utils/inquirer";

export default {
    tag: 'dvn.configure',
    description: 'Configuration',
    run: async (_backCb: Function) => {
        InquirerUtils.handlePrompt({
            'configure': {
                description: 'Configure DVNs',
                tag: 'configure',
                run: async () => {
                    console.log('Setting up DVN configuration')
                    DVNUtils.configureDVN();
                }
            },
            'setConfig':{
                description: 'Set DVN Configuration on Specified Chains',
                tag: 'setConfig',
                run: async () => {
                    DVNUtils.setDVNConfig();
                }
            }
        });
    }
}