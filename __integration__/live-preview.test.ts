import dedent from 'ts-dedent';
import TestLinterPlugin, {IntegrationTestCase} from './main.test';
import {Editor} from 'obsidian';
import expect from 'expect';
import {setWorkspaceItemMode} from './utils.test';

export const livePreviewTestCases: IntegrationTestCase[] = [
  {
    name: 'Inserting frontmatter with other content should work correctly',
    filePath: 'live-preview/add-frontmatter-and-header.md',
    async setup(plugin: TestLinterPlugin, _: Editor) {
      plugin.plugin.settings.ruleConfigs['insert-yaml-attributes'] = {
        'enabled': true,
        'text-to-insert': 'aliases: \ntags: ',
      };
      plugin.plugin.settings.ruleConfigs['file-name-heading'] = {
        'enabled': true,
      };

      await setWorkspaceItemMode(plugin.app, false);
    },
    assertions(editor: Editor) {
      expect(editor.getValue()).toBe(dedent`
        ---
        aliases: 
        tags: 
        ---
        # add-frontmatter-and-header
        ${''}
      `);
    },
  },
  {
    name: 'Moving a tag to the frontmatter should properly remove the tag and add it to the frontmatter',
    filePath: 'live-preview/tag-moved-to-yaml.md',
    async setup(plugin: TestLinterPlugin, _: Editor) {
      plugin.plugin.settings.ruleConfigs['move-tags-to-yaml'] = {
        'enabled': true,
        'how-to-handle-existing-tags': 'Remove whole tag',
      };

      await setWorkspaceItemMode(plugin.app, false);
    },
    assertions(editor: Editor) {
      expect(editor.getValue()).toBe(dedent`
        ---
        tags: [tag]
        ---
        ${''}
        # Tag Moved to YAML
        ${''}
      `);
    },
  },
];
