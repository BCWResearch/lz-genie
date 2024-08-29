// import chalk from 'chalk';

export const printLogo = (version?: string | number) => {
    // change the color of the logo to #a77dff
    const hex = 'A77DFF';

    const red = parseInt(hex.substring(0, 2), 16);
    const green = parseInt(hex.substring(2, 4), 16);
    const blue = parseInt(hex.substring(4, 6), 16);

    const fgColorString = `\x1b[38;2;${red};${green};${blue}m`;

    const clr = (str: string) => `${fgColorString}${str}\x1b[0m`
    console.log(clr(``));
    console.log(clr(` ██╗     ███████╗    ██████╗ ███████╗███╗   ██╗██╗███████╗`));
    console.log(clr(` ██║     ╚══███╔╝   ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝`));
    console.log(clr(` ██║       ███╔╝    ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗  `));
    console.log(clr(` ██║      ███╔╝     ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝  `));
    console.log(clr(` ███████╗███████╗   ╚██████╔╝███████╗██║ ╚████║██║███████╗`));
    console.log(clr(` ╚══════╝╚══════╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝ ${version ? `v${version}` : ''}`));
    console.log(clr(``));

}