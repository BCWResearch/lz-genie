import select from '@inquirer/select';
import checkbox from '@inquirer/checkbox';
import { Separator } from '@inquirer/core';

export class InquirerUtils {
    public static async handlePrompt(input: any, backCb?: Function, exit: boolean = true, message?: string) {
        const loadedTasks = (Object.keys(input));
        const pageSize = loadedTasks.length + (backCb ? 1 : 0) + (exit ? 1 : 0);
        // TODO: make it performace efficient
        const filteredTasks = loadedTasks ||loadedTasks.filter(task => !input[task]?.disabled);
        const answer = await select({
            pageSize: Math.min(10, pageSize),
            message: message ?? 'What do you want to do?\n',
            choices: [...loadedTasks.map((task, _) => {
                const name = input[task].description;
                // if (input[task]?.disabled)
                    // return [new Separator(`${name[0].toUpperCase() + name.slice(1)}`)];
                const index = filteredTasks.indexOf(task);
                return [{
                    name: `${index + 1}. ${name[0].toUpperCase() + name.slice(1)}`,
                    value: input[task].tag,
                    disabled: input[task]?.disabled
                }]
            }).flat(),

            ...(backCb ? [{
                name: `<------- Back`,
                value: 'back'
            }] : []),

            ...(exit ? [{
                name: `❌ Exit`,
                value: 'exit'
            }] : [])]
        }).catch((_) => { });
        if (!answer) {
            return;
        }
        if (answer === 'exit') {
            if (exit) {
                process.exit(0);
            }
        }
        if (backCb && answer === 'back') {
            backCb();
            return;
        }
        if (input[answer]?.run)
            input[answer].run();
        return answer;
    }
    public static async handleSelectionPrompt(input: any) {
        const loadedTasks = (Object.keys(input));
        const pageSize = loadedTasks.length;
        const answer = await checkbox({
            pageSize: Math.min(10, pageSize),
            message: 'Select modules to add or remove\n',
            choices: [
                // new Separator(' =  OpenZeppelin = '),
                ...loadedTasks.map((task, idx) => {
                    const name = input[task].description;
                    return {
                        name: `${idx + 1}. ${name[0].toUpperCase() + name.slice(1)}`,
                        value: input[task].tag
                    }
                }),
            ],
        }).catch((_) => { return [] });
        return answer;
    }

}