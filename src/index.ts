import { printLogo } from './logo';
import * as tasks from './tasks';
import { InquirerUtils } from './utils/inquirer';

(async () => {

    printLogo();
    InquirerUtils.handlePrompt(tasks.default);

})();