import dedent from 'ts-dedent';
import TestLinterPlugin, {IntegrationTestCase} from './main.test';
import {Editor} from 'obsidian';
import expect from 'expect';
import {setWorkspaceItemMode} from './utils.test';

function commonSetup(plugin: TestLinterPlugin, _: Editor) {
  plugin.plugin.settings.ruleConfigs['insert-yaml-attributes'] = {
    'enabled': true,
    'text-to-insert': 'aliases: \ntags: ',
  };
  plugin.plugin.settings.ruleConfigs['file-name-heading'] = {
    'enabled': true,
  };
}

function assertions(editor: Editor) {
  expect(editor.getValue()).toBe(dedent`
    ---
    aliases: 
    tags: 
    ---
    # add-frontmatter-and-header
    ${''}
  `);
}

export const livePreviewTestCases: IntegrationTestCase[] = [
  {
    name: 'Inserting frontmatter with other content should work correctly',
    filePath: 'live-preview/add-frontmatter-and-header.md',
    async setup(plugin: TestLinterPlugin, editor: Editor) {
      commonSetup(plugin, editor),
      await setWorkspaceItemMode(plugin.app, false);
    },
    assertions,
  },
];
