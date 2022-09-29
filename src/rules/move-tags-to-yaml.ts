import {Options, RuleType} from '../rules';
import RuleBuilder, {BooleanOptionBuilder, DropdownOptionBuilder, ExampleBuilder, OptionBuilderBase} from './rule-builder';
import dedent from 'ts-dedent';
import {ignoreListOfTypes, IgnoreTypes} from '../utils/ignore-types';
import {tagRegex} from '../utils/regex';
import {
  convertTagValueToStringOrStringArray,
  getYamlSectionValue,
  setYamlSection,
  splitValueIfSingleOrMultilineArray,
  formatYamlArrayValue,
  initYAML,
  formatYAML,
  OBSIDIAN_TAG_KEY,
  NormalArrayFormats,
  SpecialArrayFormats,
  TagSpecificArrayFormats,
} from '../utils/yaml';

class MoveTagsToYamlOptions implements Options {
  tagArrayStyle? : TagSpecificArrayFormats | NormalArrayFormats | SpecialArrayFormats = NormalArrayFormats.SingleLine;
  removeHashtagsFromTagsInBody?: boolean = false;
}

@RuleBuilder.register
export default class MoveTagsToYaml extends RuleBuilder<MoveTagsToYamlOptions> {
  get OptionsClass(): new () => MoveTagsToYamlOptions {
    return MoveTagsToYamlOptions;
  }
  get name(): string {
    return 'Move Tags to Yaml';
  }
  get description(): string {
    return 'Move all tags to Yaml frontmatter of the document.';
  }
  get type(): RuleType {
    return RuleType.YAML;
  }
  apply(text: string, options: MoveTagsToYamlOptions): string {
    return ignoreListOfTypes([IgnoreTypes.code, IgnoreTypes.inlineCode, IgnoreTypes.math], text, (text) => {
      const tags = text.match(tagRegex);
      if (!tags) {
        return text;
      }

      text = initYAML(text);
      text = formatYAML(text, (text: string) => {
        text = text.replace('---\n', '').replace('---', '');

        let tagValue = convertTagValueToStringOrStringArray(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, OBSIDIAN_TAG_KEY)));
        const existingTags = new Set<string>();
        if (typeof tagValue === 'string') {
          existingTags.add(tagValue);
          tagValue = [tagValue];
        } else if (tagValue != undefined) {
          for (const tag of tagValue) {
            existingTags.add(tag);
          }
        } else {
          tagValue = [];
        }

        for (const tag of tags) {
          const tagContent = tag.trim().substring(1);
          if (!existingTags.has(tagContent)) {
            existingTags.add(tagContent);
            tagValue.push(tagContent);
          }
        }

        const newYaml = setYamlSection(text, OBSIDIAN_TAG_KEY, formatYamlArrayValue(tagValue, options.tagArrayStyle));

        return `---\n${newYaml}---`;
      });

      if (options.removeHashtagsFromTagsInBody) {
        text = text.replace(tagRegex, (tag: string) => {
          const hashtagIndex = tag.indexOf('#');
          return tag.substring(0, hashtagIndex) + tag.substring(hashtagIndex+1);
        });
      }

      return text;
    });
  }
  get exampleBuilders(): ExampleBuilder<MoveTagsToYamlOptions>[] {
    return [
      new ExampleBuilder({
        description: 'Move tags from body to YAML',
        before: dedent`
          Text has to do with #test and #markdown
          ${''}
          #test content here
          \`\`\`
          #ignored
          Code block content is ignored
          \`\`\`
          ${''}
          This inline code \`#ignored content\`
        `,
        after: dedent`
          ---
          tags: [test, markdown]
          ---
          Text has to do with #test and #markdown
          ${''}
          #test content here
          \`\`\`
          #ignored
          Code block content is ignored
          \`\`\`
          ${''}
          This inline code \`#ignored content\`
        `,
      }),
      new ExampleBuilder({
        description: 'Move tags from body to YAML with existing tags retains the already existing ones and only adds new ones',
        before: dedent`
          ---
          tags: [test, tag2]
          ---
          Text has to do with #test and #markdown
        `,
        after: dedent`
          ---
          tags: [test, tag2, markdown]
          ---
          Text has to do with #test and #markdown
        `,
      }),
      new ExampleBuilder({
        description: 'Move tags to YAML frontmatter and then remove hashtags in body content tags `Remove the hashtag from tags in content body = true` ',
        before: dedent`
          ---
          tags: [test, tag2]
          ---
          Text has to do with #test and #markdown
        `,
        after: dedent`
          ---
          tags: [test, tag2, markdown]
          ---
          Text has to do with test and markdown
        `,
        options: {
          removeHashtagsFromTagsInBody: true,
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<MoveTagsToYamlOptions>[] {
    return [
      new DropdownOptionBuilder({
        OptionsClass: MoveTagsToYamlOptions,
        name: 'YAML tags section style',
        description: 'The style of the YAML tags section',
        optionsKey: 'tagArrayStyle',
        records: [
          {
            value: NormalArrayFormats.MultiLine as TagSpecificArrayFormats | NormalArrayFormats | SpecialArrayFormats,
            description: '```tags:\\n  - tag1```',
          },
          {
            value: NormalArrayFormats.SingleLine,
            description: '```tags: [tag1]```',
          },
          {
            value: SpecialArrayFormats.SingleStringToSingleLine,
            description: 'Tags will be formatted as a string if there is 1 or fewer elements like so ```tags: tag1```. If there is more than 1 element, it will be formatted like a single-line array.',
          },
          {
            value: SpecialArrayFormats.SingleStringToMultiLine,
            description: 'Aliases will be formatted as a string if there is 1 or fewer elements like so ```tags: tag1```. If there is more than 1 element, it will be formatted like a multi-line array.',
          },
          {
            value: TagSpecificArrayFormats.SingleLineSpaceDelimited,
            description: '```tags: [tag1 tag2]```',
          },
          {
            value: TagSpecificArrayFormats.SingleStringSpaceDelimited,
            description: '```tags: tag1 tag2```',
          },
          {
            value: SpecialArrayFormats.SingleStringCommaDelimited,
            description: '```tags: tag1, tag2```',
          },
        ],
      }),
      new BooleanOptionBuilder({
        OptionsClass: MoveTagsToYamlOptions,
        name: 'Remove the hashtag from tags in content body',
        description: 'Removes `#` from tags in content body after moving them to the Yaml frontmatter',
        optionsKey: 'removeHashtagsFromTagsInBody',
      }),
    ];
  }
}
