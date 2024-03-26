import { printLogo } from './logo';
import * as tasks from './tasks';
import {InquirerUtils} from './utils/inquirer';

(async () => {

    printLogo();
    InquirerUtils.handlePrompt(tasks.default);

    // const taskNames = (Object.keys(tasks.default));

    // const answer = await select({
    //     message: 'What do you want to do?\n',
    //     choices: [...taskNames.map((name, idx) => {
    //         return [{
    //             name: `${idx + 1}. ${name[0].toUpperCase() + name.slice(1)}`,
    //             value: name
    //         }, new Separator()]
    //     }).flat(),
    //     {
    //         name: `${taskNames.length + 1}. Exit`,
    //         value: 'exit'
    //     }
    //     ]
    // });
    // if (answer === 'exit') {
    //     process.exit(0);
    // }
    // tasks[answer].run();
})();