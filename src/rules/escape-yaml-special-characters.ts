import {Options, RuleType} from '../rules';
import RuleBuilder, {BooleanOptionBuilder, DropdownOptionBuilder, ExampleBuilder, OptionBuilderBase, TextAreaOptionBuilder} from './rule-builder';
import dedent from 'ts-dedent';
import {formatYAML, getYamlSectionValue, setYamlSection} from '../utils/yaml';

type DefaultEscapeCharacter = '"' | '\'';

class EscapeYamlSpecialCharactersOptions implements Options {
  defaultEscapeCharacter?: DefaultEscapeCharacter = '"';
  tryToEscapeSingleLineArrays?: boolean = false;
  forceYamlEscape?: string[] = [];
}

@RuleBuilder.register
export default class EscapeYamlSpecialCharacters extends RuleBuilder<EscapeYamlSpecialCharactersOptions> {
  get OptionsClass(): new () => EscapeYamlSpecialCharactersOptions {
    return EscapeYamlSpecialCharactersOptions;
  }
  get name(): string {
    return 'Escape YAML Special Characters';
  }
  get description(): string {
    return 'Escapes colons with a space after them, single quotes, and double quotes in YAML (i.e. `: `, `\'`, and `"`).';
  }
  get type(): RuleType {
    return RuleType.YAML;
  }
  apply(text: string, options: EscapeYamlSpecialCharactersOptions): string {
    return formatYAML(text, (text) => {
      const yamlLines = text.split('\n');

      const yamlLineCount = yamlLines.length;
      if (yamlLineCount < 1) {
        return text;
      }

      const isValueEscapedAlready = function(value: string): boolean {
        return value.length > 1 && ((value.startsWith('\'') && value.endsWith('\'')) ||
          (value.startsWith('"') && value.endsWith('"')));
      };

      const escapeSubstringIfNecessary = function(fullText: string, substring: string): string {
        if (isValueEscapedAlready(substring)) {
          return fullText;
        }

        // if there is no single quote, double quote, or colon to escape, skip this substring
        const substringHasSingleQuote = substring.includes('\'');
        const substringHasDoubleQuote = substring.includes('"');
        const substringHasColonWithSpaceAfterIt = substring.includes(': ');
        if (!substringHasSingleQuote && !substringHasDoubleQuote && !substringHasColonWithSpaceAfterIt) {
          return fullText;
        }

        // if the substring already has a single quote and a double quote, there is nothing that can be done to escape the substring
        if (substringHasSingleQuote && substringHasDoubleQuote) {
          return fullText;
        }

        let newText: string;
        if (substringHasSingleQuote) {
          newText = fullText.replace(substring, `"${substring}"`);
        } else if (substringHasDoubleQuote) {
          newText = fullText.replace(substring, `'${substring}'`);
        } else { // the line must have a colon with a space
          newText = fullText.replace(substring, `${options.defaultEscapeCharacter}${substring}${options.defaultEscapeCharacter}`);
        }

        return newText;
      };

      for (let i = 0; i < yamlLineCount; i++) {
        const line = yamlLines[i].trim();

        const firstColonIndex = line.indexOf(':');
        const isKeyValueLineWithoutValue = firstColonIndex < 0 || firstColonIndex + 1 >= line.length;
        const startsWithDash = line.startsWith('-');
        const isArrayItemLineWithoutValue = startsWithDash && line.length < 2;
        if (isKeyValueLineWithoutValue && isArrayItemLineWithoutValue) {
          continue;
        }

        let valueStartIndex = 1;
        if (!startsWithDash) {
          valueStartIndex += firstColonIndex;
        }

        const value = line.substring(valueStartIndex).trim();
        if (value.startsWith('[')) {
          if (options.tryToEscapeSingleLineArrays) {
            if (value.length < 3) {
              continue;
            }

            // Note: this does not account for list items that are already in single or double quotes,
            // but we can address that if we run into such a scenario
            const arrayItems = value.substring(1, value.length - 1).split(',');
            const numberOfArrayItems = arrayItems.length;
            for (let j = 0; j < numberOfArrayItems; j++) {
              let arrayItem = arrayItems[j].trim();
              if (arrayItem.startsWith('[')) {
                arrayItem = arrayItem.substring(1).trimStart();
              }

              if (arrayItem.endsWith(']')) {
                arrayItem = arrayItem.substring(0, arrayItem.length - 1).trimEnd();
              }

              arrayItems[j] = escapeSubstringIfNecessary(arrayItems[j], arrayItem);
            }

            yamlLines[i] = yamlLines[i].replace(value, '[' + arrayItems.join(',') + ']');
          }

          continue;
        }

        yamlLines[i] = escapeSubstringIfNecessary(yamlLines[i], value);
      }

      let newYaml = yamlLines.join('\n');

      for (const yamlKeyToEscape of options.forceYamlEscape) {
        const keyValue = getYamlSectionValue(newYaml, yamlKeyToEscape);

        if (keyValue != null) {
          // skip yaml array values or already escaped values
          if (keyValue.includes('\n') || keyValue.startsWith(' [') || isValueEscapedAlready(keyValue)) {
            continue;
          }

          newYaml = setYamlSection(newYaml, yamlKeyToEscape, ` ${options.defaultEscapeCharacter}${keyValue}${options.defaultEscapeCharacter}`);
        }
      }

      return newYaml;
    });
  }
  get exampleBuilders(): ExampleBuilder<EscapeYamlSpecialCharactersOptions>[] {
    return [
      new ExampleBuilder({
        description: 'YAML without anything to escape',
        before: dedent`
          ---
          key: value
          otherKey: []
          ---
        `,
        after: dedent`
          ---
          key: value
          otherKey: []
          ---
        `,
      }),
      new ExampleBuilder({
        description: 'YAML with unescaped values',
        before: dedent`
          ---
          key: value: with colon in the middle
          secondKey: value with ' a single quote present
          thirdKey: "already escaped: value"
          fourthKey: value with " a double quote present
          fifthKey: value with both ' " a double and single quote present is not escaped, but is invalid YAML
          sixthKey: colon:between characters is fine
          otherKey: []
          ---
        `,
        after: dedent`
          ---
          key: "value: with colon in the middle"
          secondKey: "value with ' a single quote present"
          thirdKey: "already escaped: value"
          fourthKey: 'value with " a double quote present'
          fifthKey: value with both ' " a double and single quote present is not escaped, but is invalid YAML
          sixthKey: colon:between characters is fine
          otherKey: []
          ---
        `,
      }),
      new ExampleBuilder({
        description: 'YAML with unescaped values in an expanded list with `Default Escape Character = \'`',
        before: dedent`
          ---
          key:
            - value: with colon in the middle
            - value with ' a single quote present
            - 'already escaped: value'
            - value with " a double quote present
            - value with both ' " a double and single quote present is not escaped, but is invalid YAML
            - colon:between characters is fine
          ---
        `,
        after: dedent`
          ---
          key:
            - 'value: with colon in the middle'
            - "value with ' a single quote present"
            - 'already escaped: value'
            - 'value with " a double quote present'
            - value with both ' " a double and single quote present is not escaped, but is invalid YAML
            - colon:between characters is fine
          ---
        `,
        options: {
          defaultEscapeCharacter: '\'',
        },
      }),
      new ExampleBuilder({
        description: 'YAML with unescaped values with arrays',
        before: dedent`
          ---
          array: [value: with colon in the middle, value with ' a single quote present, "already escaped: value", value with " a double quote present, value with both ' " a double and single quote present is not escaped but is invalid YAML, colon:between characters is fine]
          nestedArray: [[value: with colon in the middle, value with ' a single quote present], ["already escaped: value", value with " a double quote present], value with both ' " a double and single quote present is not escaped but is invalid YAML, colon:between characters is fine]
          nestedArray2: [[value: with colon in the middle], value with ' a single quote present]
          ---
          ${''}
          _Note that escaped commas in a YAML array will be treated as a separator._
        `,
        after: dedent`
          ---
          array: ["value: with colon in the middle", "value with ' a single quote present", "already escaped: value", 'value with " a double quote present', value with both ' " a double and single quote present is not escaped but is invalid YAML, colon:between characters is fine]
          nestedArray: [["value: with colon in the middle", "value with ' a single quote present"], ["already escaped: value", 'value with " a double quote present'], value with both ' " a double and single quote present is not escaped but is invalid YAML, colon:between characters is fine]
          nestedArray2: [["value: with colon in the middle"], "value with ' a single quote present"]
          ---
          ${''}
          _Note that escaped commas in a YAML array will be treated as a separator._
        `,
        options: {
          tryToEscapeSingleLineArrays: true,
        },
      }),
      new ExampleBuilder({
        description: 'Force YAML keys to be escaped with double quotes where not already escaped with `Force Yaml Escape on Keys = [\'key\', \'title\', \'bool\']`',
        before: dedent`
          ---
          key: 'Already escaped value'
          title: This is a title
          bool: false
          unaffected: value
          ---
          ${''}
          _Note that the force Yaml key option should not be used with arrays._
        `,
        after: dedent`
          ---
          key: 'Already escaped value'
          title: "This is a title"
          bool: "false"
          unaffected: value
          ---
          ${''}
          _Note that the force Yaml key option should not be used with arrays._
        `,
        options: {
          forceYamlEscape: ['key', 'title', 'bool'],
          defaultEscapeCharacter: '"',
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<EscapeYamlSpecialCharactersOptions>[] {
    return [
      new DropdownOptionBuilder<EscapeYamlSpecialCharactersOptions, DefaultEscapeCharacter>({
        OptionsClass: EscapeYamlSpecialCharactersOptions,
        name: 'Default Escape Character',
        description: 'The default character to use to escape YAML values when a single quote and double quote are not present.',
        optionsKey: 'defaultEscapeCharacter',
        records: [
          {
            value: '"',
            description: 'Use a double quote to escape if no single or double quote is present',
          },
          {
            value: '\'',
            description: 'Use a single quote to escape if no single or double quote is present',
          },
        ],
      }),
      new BooleanOptionBuilder({
        OptionsClass: EscapeYamlSpecialCharactersOptions,
        name: 'Try to Escape Single Line Arrays',
        description: 'Tries to escape array values assuming that an array starts with `[`, ends with `]`, and has items that are delimited by `,`.',
        optionsKey: 'tryToEscapeSingleLineArrays',
      }),
      new TextAreaOptionBuilder({
        OptionsClass: EscapeYamlSpecialCharactersOptions,
        name: 'Force YAML Escape on Keys',
        description: 'Uses the YAML escape character on the specified YAML keys separated by a new line character if it is not already escaped. **Do not use on YAML arrays.**',
        optionsKey: 'forceYamlEscape',
      }),
    ];
  }
  get hasSpecialExecutionOrder(): boolean {
    return true;
  }
}
