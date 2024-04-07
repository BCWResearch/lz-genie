import * as fs from 'fs';
import * as path from 'path';
import { SingleBar, Presets } from 'cli-progress';

export class FileCopyUtil {
    private static progressBar = new SingleBar({
        // format: 'Copying project files... {bar} {percentage}% | ETA: {eta}s | {value}/{total}',
        // barCompleteChar: '\u2588',
        // barIncompleteChar: '\u2591',
        // hideCursor: true
    }, Presets.shades_classic);
    private static totalSize = 0;
    private static copiedSize = 0;

    private static async calculateTotalSize(directory: string): Promise<number> {
        let totalSize = 0;
        const files = await fs.promises.readdir(directory, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            if (file.isDirectory()) {
                totalSize += await FileCopyUtil.calculateTotalSize(fullPath);
            } else {
                const stats = await fs.promises.stat(fullPath);
                totalSize += stats.size;
            }
        }
        return totalSize;
    }

    private static async copyFileWithProgress(source: string, target: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(source);
            const writeStream = fs.createWriteStream(target);

            readStream.on('data', (chunk: Buffer) => {
                FileCopyUtil.copiedSize += chunk.length;
                FileCopyUtil.progressBar.update(FileCopyUtil.copiedSize);
            });

            readStream.on('error', (err) => reject(err));
            writeStream.on('error', (err) => reject(err));
            writeStream.on('finish', () => resolve());

            readStream.pipe(writeStream);
        });
    }

    public static async copyDirWithProgress(srcDir: string, destDir: string): Promise<void> {
        FileCopyUtil.totalSize = await FileCopyUtil.calculateTotalSize(srcDir);
        FileCopyUtil.progressBar.start(FileCopyUtil.totalSize, 0);

        const copyDirectory = async (src: string, dest: string) => {
            const entries = await fs.promises.readdir(src, { withFileTypes: true });
            await fs.promises.mkdir(dest, { recursive: true });

            for (let entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {
                    await copyDirectory(srcPath, destPath);
                } else {
                    await FileCopyUtil.copyFileWithProgress(srcPath, destPath);
                }
            }
        };

        await copyDirectory(srcDir, destDir);
        FileCopyUtil.progressBar.stop();
    }
}
