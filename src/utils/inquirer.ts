import select from '@inquirer/select';
import checkbox, { Separator } from '@inquirer/checkbox';

export class InquirerUtils {
    public static async handlePrompt(input: any, backCb?: Function, exit: boolean = true, message?: string) {
        const loadedTasks = (Object.keys(input));
        const answer = await select({
            pageSize: loadedTasks.length + (backCb ? 1 : 0) + (exit ? 1 : 0),
            message: message ?? 'What do you want to do?\n',
            choices: [...loadedTasks.map((task, idx) => {
                const name = input[task].description;
                return [{
                    name: `${idx + 1}. ${name[0].toUpperCase() + name.slice(1)}`,
                    value: input[task].tag
                }]
            }).flat(),

            ...(backCb ? [{
                name: `${loadedTasks.length + 1}. Back`,
                value: 'back'
            }] : []),

            ...(exit ? [{
                name: `${loadedTasks.length + (backCb ? 2 : 1)}. Exit`,
                value: 'exit'
            }] : [])]
        });
        if (answer === 'exit') {
            if (exit) {
                process.exit(0);
            }
        }
        if (answer === 'back') {
            backCb();
            return;
        }
        input[answer].run();
    }
    public static async handleSelectionPrompt(input: any) {
        const loadedTasks = (Object.keys(input));
        const answer = await checkbox({
            pageSize: loadedTasks.length,
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
        });
        return answer;
    }

}