// import { input } from '@inquirer/prompts';
import select, { Separator } from '@inquirer/select';
import * as tasks from './tasks';

(async () => {
    const taskNames = (Object.keys(tasks));
    const answer = await select({
        message: 'What do you want to do?\n',
        choices: taskNames.map((name, idx) => {
            return [{
                name: `${idx+1}. ${name[0].toUpperCase() + name.slice(1)}`,
                value: name
            }, new Separator()]
        }).flat()
    });
    tasks[answer].run();
})();