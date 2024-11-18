import { ProjectSetupUtil } from '../../utils/projectsetup';
import { FileCopyUtil } from '../../utils/filecopy';
import { PackageManagerUtil } from '../../utils/packagemanager';
import PostHogUtil from '../../utils/posthog';
import { input } from '@inquirer/prompts';
import { join } from 'path';

// Mock all dependencies
jest.mock( '../../utils/filecopy');
jest.mock('../../utils/packagemanager');
jest.mock('../../utils/posthog');
jest.mock('@inquirer/prompts');
jest.mock('path');

describe('Tests for Project Setup', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        (join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (input as jest.Mock).mockResolvedValue('test-project');
        (FileCopyUtil.copyDirWithProgress as jest.Mock).mockResolvedValue(undefined);
        (PackageManagerUtil.installDependencies as jest.Mock).mockResolvedValue(undefined);
        (PostHogUtil.trackEvent as jest.Mock).mockImplementation(() => {});
    });

    describe('Create Project From Template', () => {
        it('should successfully create a project from template', async () => {
            const template = 'test-template';
            const projectName = 'test-project';

            // Mock console.log to verify output
            const consoleSpy = jest.spyOn(console, 'log');

            await ProjectSetupUtil.createProjectFromTemplate(template, projectName);

            // Verify FileCopyUtil was called with correct paths
            expect(FileCopyUtil.copyDirWithProgress).toHaveBeenCalledWith(
                expect.stringContaining('test-template'),
                expect.stringContaining('test-project')
            );

            // Verify PackageManagerUtil was called correctly
            expect(PackageManagerUtil.installDependencies).toHaveBeenCalledWith(
                'yarn',
                expect.stringContaining('test-project')
            );

            // Verify console output
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Setting up an TEST-TEMPLATE project test-project')
            );
        });

        it('should handle package installation error gracefully', async () => {
            const template = 'test-template';
            const projectName = 'test-project';

            // Mock package installation to fail
            const error = new Error('Installation failed');
            (PackageManagerUtil.installDependencies as jest.Mock).mockRejectedValue(error);

            // Mock console.error to verify error handling
            const consoleSpy = jest.spyOn(console, 'error');

            await ProjectSetupUtil.createProjectFromTemplate(template, projectName);

            expect(consoleSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('create new project', () => {
        it('should create a new project with valid input', async () => {
            const template = 'test-template';
            const projectName = 'test-project';

            (input as jest.Mock).mockResolvedValue(projectName);

            await ProjectSetupUtil.createNewProject(template);

            // Verify PostHog event was tracked
            expect(PostHogUtil.trackEvent).toHaveBeenCalledWith('CFT_test-template');

            // Verify project creation was called
            expect(FileCopyUtil.copyDirWithProgress).toHaveBeenCalled();
        });

        it('should handle empty project name', async () => {
            const template = 'test-template';

            // Mock input to return undefined
            (input as jest.Mock).mockResolvedValue(undefined);

            // Mock console.error to verify error message
            const consoleSpy = jest.spyOn(console, 'error');

            await ProjectSetupUtil.createNewProject(template);

            expect(consoleSpy).toHaveBeenCalledWith('Project name is required!');
            expect(FileCopyUtil.copyDirWithProgress).not.toHaveBeenCalled();
        });

        it('should handle input prompt rejection', async () => {
            const template = 'test-template';

            // Mock input to reject
            (input as jest.Mock).mockRejectedValue(new Error('Prompt cancelled'));

            // Mock console.error to verify error message
            const consoleSpy = jest.spyOn(console, 'error');

            await ProjectSetupUtil.createNewProject(template);

            expect(consoleSpy).toHaveBeenCalledWith('Project name is required!');
            expect(FileCopyUtil.copyDirWithProgress).not.toHaveBeenCalled();
        });
    });
});