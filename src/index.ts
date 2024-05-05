#! /usr/bin/env node
// import { printLogo } from './logo';
import * as tasks from './tasks';
import { InquirerUtils } from './utils/inquirer';

(async () => {

    // printLogo();
    try {
        await InquirerUtils.handlePrompt(tasks.default);
    } catch (_) {

    }

})();