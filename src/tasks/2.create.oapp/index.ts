import { ProjectSetupUtil } from '../../utils/projectsetup';

export default {
    tag: 'create.oapp',
    description: 'Create an OApp',
    run: async (_backCb: Function) => {
        await ProjectSetupUtil.createNewProject('oapp');
    }
}