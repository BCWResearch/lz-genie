import { DVNUtils } from "../../utils/dvn";
import { InquirerUtils } from "../../utils/inquirer";

export default {
    tag: 'dvn.configure',
    description: 'Set up DVN configuration',
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
                description: 'Set DVN configuration on Chain',
                tag: 'setConfig',
                run: async () => {
                    DVNUtils.setDVNConfig();
                }
            }
        });
    }
}