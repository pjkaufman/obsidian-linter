import {IgnoreTypes} from '../utils/ignore-types';
import {Options, RuleType} from '../rules';
import RuleBuilder, {DropdownOptionBuilder, ExampleBuilder, OptionBuilderBase} from './rule-builder';
import dedent from 'ts-dedent';
import {getMarkdownImageLinkInfo, getMarkdownLinkInfo, LinkInfo} from '../utils/mdast';
import {isURL, replaceTextBetweenStartAndEndWithNewValue} from '../utils/strings';

type LinkFormatValues = 'wiki' | 'markdown';

// type GetLinkPathFunction = (linkpath: string, sourcePath: string) => string

class LinkFormatOptions implements Options {
  style: LinkFormatValues = 'markdown';

  // @RuleBuilder.noSettingControl()
  //   isInternalLink?: () => boolean = () => {
  //     return true;
  //   };

  // @RuleBuilder.noSettingControl()
  //   currentFilePath?: string = '';
  // @RuleBuilder.noSettingControl()
  //   getFirstLinkpathDestString: GetLinkPathFunction;
}

@RuleBuilder.register
export default class LinkFormat extends RuleBuilder<LinkFormatOptions> {
  constructor() {
    super({
      nameKey: 'rules.link-format.name',
      descriptionKey: 'rules.link-format.description',
      type: RuleType.CONTENT,
      ruleIgnoreTypes: [IgnoreTypes.code, IgnoreTypes.math, IgnoreTypes.yaml, IgnoreTypes.math, IgnoreTypes.inlineMath],
    });
  }
  get OptionsClass(): new () => LinkFormatOptions {
    return LinkFormatOptions;
  }
  apply(text: string, options: LinkFormatOptions): string {
    if (options.style === 'wiki') {
      return this.convertToWikiLinks(text);
    }

    return text;
  }
  convertToWikiLinks(text: string): string {
    const markdownLinkInfo = getMarkdownLinkInfo(text);
    for (const linkInfo of markdownLinkInfo) {
      console.log(linkInfo);
      if (isURL(linkInfo.link)) {
        continue;
      }

      text = replaceTextBetweenStartAndEndWithNewValue(text, linkInfo.position.startIndex, linkInfo.position.endIndex, this.linkInfoToWikiLink(linkInfo));
    }

    // const markdownImageInfo = getMarkdownImageLinkInfo(text);
    // for (const imageLinkInfo of markdownImageInfo) {
    //   text = replaceTextBetweenStartAndEndWithNewValue(text, imageLinkInfo.position.startIndex, imageLinkInfo.position.endIndex, this.linkInfoToWikiLink(imageLinkInfo));
    // }

    return text;
  }
  linkInfoToWikiLink(linkInfo: LinkInfo): string {
    let fileLink = linkInfo.link;
    const indexOfHashtag = fileLink.indexOf('#');
    let headerOrBlockRef = '';
    if (indexOfHashtag !== -1) {
      headerOrBlockRef = decodeURI(fileLink.substring(indexOfHashtag));
      fileLink = fileLink.substring(0, indexOfHashtag);
    }

    const extensionStart = fileLink.lastIndexOf('.');
    if (extensionStart !== -1) {
      fileLink = fileLink.substring(0, extensionStart);
    }

    let altText: string;
    if (linkInfo.text !== '') {
      altText = '|' + linkInfo.text;
    } else {
      altText = '';
    }

    return `[[${fileLink}${headerOrBlockRef}${altText}]]`;
  }
  get exampleBuilders(): ExampleBuilder<LinkFormatOptions>[] {
    return [
      new ExampleBuilder<LinkFormatOptions>({
        description: 'Emphasis indicators should use underscores when style is set to \'underscore\'',
        before: dedent`
          # Emphasis Cases
          ${''}
          *Test emphasis*
          * Test not emphasized *
          This is *emphasized* mid sentence
          This is *emphasized* mid sentence with a second *emphasis* on the same line
          This is ***bold and emphasized***
          This is ***nested bold** and ending emphasized*
          This is ***nested emphasis* and ending bold**
          ${''}
          **Test bold**
          ${''}
          * List Item1 with *emphasized text*
          * List Item2
        `,
        after: dedent`
          # Emphasis Cases
          ${''}
          _Test emphasis_
          * Test not emphasized *
          This is _emphasized_ mid sentence
          This is _emphasized_ mid sentence with a second _emphasis_ on the same line
          This is _**bold and emphasized**_
          This is _**nested bold** and ending emphasized_
          This is **_nested emphasis_ and ending bold**
          ${''}
          **Test bold**
          ${''}
          * List Item1 with _emphasized text_
          * List Item2
        `,
        options: {
          style: 'underscore',
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<LinkFormatOptions>[] {
    return [
      new DropdownOptionBuilder<LinkFormatOptions, LinkFormatValues>({
        OptionsClass: LinkFormatOptions,
        nameKey: 'rules.link-format.style.name',
        descriptionKey: 'rules.link-format.style.description',
        optionsKey: 'style',
        records: [
          {
            value: 'markdown',
            description: 'Makes sure that all links are markdown links',
          },
          {
            value: 'wiki',
            description: 'Makes sure that all links are wiki links',
          },
        ],
      }),
    ];
  }
}
