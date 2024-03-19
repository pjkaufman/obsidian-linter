import {Editor, MarkdownView, Plugin, TFile, normalizePath} from 'obsidian';
import LinterPlugin from 'src/main';
import {obsidianModeTestCases} from './obsidian-mode.test';
import {setWorkspaceItemMode} from './utils.test';
import {customCommandTestCases} from './custom-commands.test';
import {livePreviewTestCases} from './live-preview.test';

export type IntegrationTestCase = {
  name: string,
  filePath: string,
  setup?: (plugin: TestLinterPlugin, editor: Editor) => void,
  assertions: (editor: Editor) => void,
}

export default class TestLinterPlugin extends Plugin {
  regularTests: Array<IntegrationTestCase> = [...obsidianModeTestCases, ...livePreviewTestCases];
  afterCacheUpdateTests: Array<IntegrationTestCase> = [...customCommandTestCases];
  plugin: LinterPlugin;

  async onload() {
    this.addCommand({
      id: 'run-linter-tests',
      name: 'Run Linter Tests',
      callback: async () => {
        await this.setup();
        await this.runTests();
      },
    });
  }

  async setup() {
    if (!this.plugin) {
      this.plugin = new LinterPlugin(this.app, this.manifest);

      await this.plugin.onload();
    } else {
      await this.resetSettings();
    }
  }

  async runTests() {
    const activeLeaf = this.getActiveLeaf();
    if (!activeLeaf) {
      console.error('failed to get active leaf');
      return;
    }

    for (const t of this.regularTests) {
      const file = this.getFileFromPath(t.filePath);
      if (!file) {
        console.error('failed to get file: ' + t.filePath);
        continue;
      }

      await activeLeaf.leaf.openFile(file);
      const originalText = activeLeaf.editor.getValue();
      await this.resetSettings();

      try {
        if (t.setup) {
          await t.setup(this, activeLeaf.editor);
        }

        this.plugin.runLinterEditor(activeLeaf.editor);
        await t.assertions(activeLeaf.editor);

        console.log('✅', t.name);
      } catch (e) {
        console.log('❌', t.name);
        console.error(e);
      }

      await this.resetFileContents(activeLeaf, originalText);
    }

    await this.runMetadataTests(this.afterCacheUpdateTests, activeLeaf);
  }

  async runMetadataTests(tests: IntegrationTestCase[], activeLeaf: MarkdownView) {
    let index = 0;
    let originalText = await this.setupMetadataTest(this, tests[index], activeLeaf);
    if (originalText == null) {
      return;
    }

    const that = this;

    this.plugin.setCustomCommandCallback(async (file: TFile) => {
      if (file !== activeLeaf.file) {
        return;
      }

      if (originalText == null) {
        that.plugin.setCustomCommandCallback(null);
      }

      const t = tests[index];
      try {
        await t.assertions(activeLeaf.editor);

        console.log('✅', t.name);
      } catch (e) {
        console.log('❌', t.name);
        console.error(e);
      }

      await that.resetFileContents(activeLeaf, originalText);

      originalText = null;
      while (index+1 < tests.length && originalText == null) {
        originalText = await that.setupMetadataTest(that, tests[++index], activeLeaf);
      }

      // remove the custom commands callback once all tests have run
      if (index >= tests.length && originalText == null) {
        that.plugin.setCustomCommandCallback(null);
      }
    });
  }

  async setupMetadataTest(testPlugin: TestLinterPlugin, t: IntegrationTestCase, activeLeaf: MarkdownView): Promise<string> {
    const file = this.getFileFromPath(t.filePath);
    if (!file) {
      console.error('failed to get file: ' + t.filePath);
      return null;
    }

    await activeLeaf.leaf.openFile(file);
    const originalText = activeLeaf.editor.getValue();
    await testPlugin.resetSettings();

    try {
      if (t.setup) {
        await t.setup(this, activeLeaf.editor);
      }

      testPlugin.plugin.runLinterEditor(activeLeaf.editor);
    } catch (e) {
      console.log('❌', t.name);
      console.error(e);
      await testPlugin.resetFileContents(activeLeaf, originalText);

      return null;
    }

    return originalText;
  }

  onunload(): void {
    if (this.plugin) {
      this.plugin.onunload();
    }
  }

  private async resetFileContents(activeLeaf: MarkdownView, originalText: string) {
    if (activeLeaf) {
      activeLeaf.editor.setValue(originalText);
      await setWorkspaceItemMode(this.app, true);
    }
  }

  private getActiveLeaf(): MarkdownView {
    const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeLeaf) return null;
    return activeLeaf;
  }

  private getFileFromPath(filePath: string): TFile {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(filePath));
    if (file instanceof TFile) {
      return file;
    }

    return null;
  }

  private async resetSettings() {
    await this.plugin.loadSettings();
  }
}
