import {Options, RuleType} from '../rules';
import RuleBuilder, {BooleanOptionBuilder, DropdownOptionBuilder, ExampleBuilder, OptionBuilderBase, TextAreaOptionBuilder} from './rule-builder';
import dedent from 'ts-dedent';
import {convertAliasValueToStringOrStringArray,
  convertTagValueToStringOrStringArray,
  formatYAML,
  formatYamlArrayValue,
  getYamlSectionValue,
  loadYAML,
  NormalArrayFormats,
  OBSIDIAN_ALIASES_KEY,
  OBSIDIAN_TAG_KEY,
  setYamlSection,
  SpecialArrayFormats,
  splitValueIfSingleOrMultilineArray,
  TagSpecificArrayFormats} from '../utils/yaml';

class FormatYamlArrayOptions implements Options {
  aliasArrayStyle?: NormalArrayFormats | SpecialArrayFormats = NormalArrayFormats.SingleLine;
  formatAliasKey?: boolean = true;
  tagArrayStyle?: TagSpecificArrayFormats | NormalArrayFormats | SpecialArrayFormats = NormalArrayFormats.SingleLine;
  formatTagKey?: boolean = true;
  defaultArrayStyle?: NormalArrayFormats = NormalArrayFormats.SingleLine;
  formatArrayKeys?: boolean = true;
  forceSingleLineArrayStyle?: string[] = [];
  forceMultiLineArrayStyle?: string[] = [];
}

@RuleBuilder.register
export default class RuleTemplate extends RuleBuilder<FormatYamlArrayOptions> {
  get OptionsClass(): new () => FormatYamlArrayOptions {
    return FormatYamlArrayOptions;
  }
  get name(): string {
    return 'Format YAML Array';
  }
  get description(): string {
    return 'Allows for the formatting of regular YAML arrays as either multi-line or single-line and `tags` and `aliases` are allowed to have some Obsidian specific YAML formats. **_Note that_ `single string to single-line` _goes from a single string entry to a single-line array if more than 1 entry is present. The same is true for_ `single string to multi-line` _except it becomes a multi-line array._**';
  }
  get type(): RuleType {
    return RuleType.YAML;
  }
  apply(text: string, options: FormatYamlArrayOptions): string {
    return formatYAML(text, (text: string) => {
      const yaml = loadYAML(text.replace('---\n', '').replace('\n---', ''));
      if (!yaml) {
        return text;
      }

      // https://stackoverflow.com/a/44198641
      const isValidDate = function(date: any) {
        return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
      };

      if (options.formatAliasKey && Object.keys(yaml).includes(OBSIDIAN_ALIASES_KEY)) {
        text = setYamlSection(text, OBSIDIAN_ALIASES_KEY, formatYamlArrayValue(convertAliasValueToStringOrStringArray(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, OBSIDIAN_ALIASES_KEY))), options.aliasArrayStyle));
      }

      if (options.formatTagKey && Object.keys(yaml).includes(OBSIDIAN_TAG_KEY)) {
        text = setYamlSection(text, OBSIDIAN_TAG_KEY, formatYamlArrayValue(convertTagValueToStringOrStringArray(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, OBSIDIAN_TAG_KEY))), options.tagArrayStyle));
      }

      if (options.formatArrayKeys) {
        const keysToIgnore = [OBSIDIAN_ALIASES_KEY, OBSIDIAN_TAG_KEY, ...options.forceMultiLineArrayStyle, ...options.forceSingleLineArrayStyle];

        for (const key of Object.keys(yaml)) {
          // skip non-arrays and already accounted for keys
          if (keysToIgnore.includes(key) || !(typeof yaml[key] === 'object' && !isValidDate(yaml[key]) && yaml[key] as string[])) {
            continue;
          }

          text = setYamlSection(text, key, formatYamlArrayValue(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, key)), options.defaultArrayStyle));
        }
      }

      for (const singleLineArrayKey of options.forceSingleLineArrayStyle) {
        if (!Object.keys(yaml).includes(singleLineArrayKey)) {
          continue;
        }

        text = setYamlSection(text, singleLineArrayKey, formatYamlArrayValue(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, singleLineArrayKey)), NormalArrayFormats.SingleLine));
      }

      for (const multiLineArrayKey of options.forceMultiLineArrayStyle) {
        if (!Object.keys(yaml).includes(multiLineArrayKey)) {
          continue;
        }

        text = setYamlSection(text, multiLineArrayKey, formatYamlArrayValue(splitValueIfSingleOrMultilineArray(getYamlSectionValue(text, multiLineArrayKey)), NormalArrayFormats.MultiLine));
      }

      return text;
    });
  }
  get exampleBuilders(): ExampleBuilder<FormatYamlArrayOptions>[] {
    return [
      new ExampleBuilder({
        description: 'Format tags as a single-line array delimited by spaces and aliases as a multi-line array and format the key `test` to be a single-line array',
        before: dedent`
          ---
          tags:
            - computer
            - research
          aliases: Title 1, Title2
          test: this is a value
          ---
          ${''}
          # Notes:
          ${''}
          Nesting YAML arrays may result in unexpected results.
          ${''}
          Multi-line arrays will have empty values removed only leaving one if it is completely empty. The same is not true for single-line arrays as that is invalid YAML unless it comes as the last entry in the array.
        `,
        after: dedent`
          ---
          tags: [computer, research]
          aliases:
            - Title 1
            - Title2
          test: [this is a value]
          ---
          ${''}
          # Notes:
          ${''}
          Nesting YAML arrays may result in unexpected results.
          ${''}
          Multi-line arrays will have empty values removed only leaving one if it is completely empty. The same is not true for single-line arrays as that is invalid YAML unless it comes as the last entry in the array.
        `,
        options: {
          aliasArrayStyle: NormalArrayFormats.MultiLine,
          forceSingleLineArrayStyle: ['test'],
        },
      }),
      new ExampleBuilder({
        description: 'Format tags as a single string with space delimiters, ignore aliases, and format regular YAML arrays as single-line arrays',
        before: dedent`
          ---
          aliases: Typescript
          types:
            - thought provoking
            - peer reviewed
          tags: [computer, science, trajectory]
          ---
        `,
        after: dedent`
          ---
          aliases: Typescript
          types: [thought provoking, peer reviewed]
          tags: computer science trajectory
          ---
        `,
        options: {
          formatAliasKey: false,
          tagArrayStyle: TagSpecificArrayFormats.SingleStringSpaceDelimited,
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<FormatYamlArrayOptions>[] {
    return [
      new DropdownOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'YAML aliases section style',
        description: 'The style of the YAML aliases section',
        optionsKey: 'aliasArrayStyle',
        records: [
          { // as types is needed to allow for the proper types as options otherwise it assumes it has to be the specific enum value
            value: NormalArrayFormats.MultiLine as NormalArrayFormats | SpecialArrayFormats,
            description: '```aliases:\\n  - Title```',
          },
          {
            value: NormalArrayFormats.SingleLine,
            description: '```aliases: [Title]```',
          },
          {
            value: SpecialArrayFormats.SingleStringCommaDelimited,
            description: '```aliases: Title, Other Title```',
          },
          {
            value: SpecialArrayFormats.SingleStringToSingleLine,
            description: 'Aliases will be formatted as a string if there is 1 or fewer elements like so ```aliases: Title```. If there is more than 1 element, it will be formatted like a single-line array.',
          },
          {
            value: SpecialArrayFormats.SingleStringToMultiLine,
            description: 'Aliases will be formatted as a string if there is 1 or fewer elements like so ```aliases: Title```. If there is more than 1 element, it will be formatted like a multi-line array.',
          },
        ],
      }),
      new BooleanOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'Format YAML aliases section',
        description: 'Turns on formatting for the YAML aliases section. **You should not enable this option alongside the rule `YAML Title Alias` as they may not work well together or they may have different format styles selected causing unexpected results.**',
        optionsKey: 'formatAliasKey',
      }),
      new DropdownOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
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
        OptionsClass: FormatYamlArrayOptions,
        name: 'Format YAML tags section',
        description: 'Turns on formatting for the YAML tags section.',
        optionsKey: 'formatTagKey',
      }),
      new DropdownOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'Default YAML array section style',
        description: 'The style of other YAML arrays that are not `tags`, `aliases` or  in `Force key values to be single-line arrays` and `Force key values to be multi-line arrays`',
        optionsKey: 'defaultArrayStyle',
        records: [
          {
            value: NormalArrayFormats.MultiLine as NormalArrayFormats,
            description: '```key:\\n  - value```',
          },
          {
            value: NormalArrayFormats.SingleLine,
            description: '```key: [value]```',
          },
        ],
      }),
      new BooleanOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'Format YAML array sections',
        description: 'Turns on formatting for regular YAML arrays',
        optionsKey: 'formatArrayKeys',
      }),
      new TextAreaOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'Force key values to be single-line arrays',
        description: 'Forces the YAML array for the new line separated keys to be in single-line format (leave empty to disable this option)',
        optionsKey: 'forceSingleLineArrayStyle',
      }),
      new TextAreaOptionBuilder({
        OptionsClass: FormatYamlArrayOptions,
        name: 'Force key values to be multi-line arrays',
        description: 'Forces the YAML array for the new line separated keys to be in multi-line format (leave empty to disable this option)',
        optionsKey: 'forceMultiLineArrayStyle',
      }),
    ];
  }
}
