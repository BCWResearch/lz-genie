import { ProjectSetupUtil } from '../../utils/projectsetup';

export default {
    tag: 'create.oapp',
    description: 'Create an empty OApp Project',
    run: async (_backCb: Function) => {
        await ProjectSetupUtil.createNewProject('oapp');
    }
}