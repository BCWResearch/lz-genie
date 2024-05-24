
import { DeployUtils } from '../../utils/deploy';

export default {
    tag: 'deploy.proj',
    description: 'Deploy Your Project',
    run: async (_backCb: Function) => {
        await DeployUtils.deployProject();
    }
}