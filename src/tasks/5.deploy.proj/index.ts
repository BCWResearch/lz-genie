
import { DeployUtils } from '../../utils/deploy';

export default {
    tag: 'deploy.proj',
    description: 'Deploy a Project',
    run: async (_backCb: Function) => {
        await DeployUtils.deployProject();
    }
}