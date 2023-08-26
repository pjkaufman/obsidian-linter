import LinkFormat from '../src/rules/link-format';
import dedent from 'ts-dedent';
import {ruleTest} from './common';

ruleTest({
  RuleBuilderClass: LinkFormat,
  testCases: [
    {
      testName: 'Converts simple markdown links to wiki links',
      before: dedent`
        Here is a markdown link: [github.com](https://github.com/)
        Here is a non-URL markdown link: [not the file title](file.md)
        Here is a markdown link with the same name as the file name [file](./some-folder/file.md)
      `,
      after: dedent`
        Here is a markdown link: [github.com](https://github.com/)
        Here is a non-URL markdown link: [[file|not the file title]]
        Here is a markdown link with the same name as the file name [[./some-folder/file|file]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When a markdown link has no text, the resulting wiki link is just the link',
      before: dedent`
        [](file.md)
        [](https://github.com/)
      `,
      after: dedent`
        [[file]]
        [](https://github.com/)
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When a markdown link has a header, the file is converted correctly',
      before: dedent`
        [](file.md#header%20name)
        [header name](file.md#header%20name)
        [alt text](file.md#header%20name)
      `,
      after: dedent`
        [[file#header name]]
        [[file#header name|header name]]
        [[file#header name|alt text]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When a markdown link has a paragraph reference, the file is converted correctly',
      before: dedent`
        [](file.md#^0b927e)
        [^0b927e](file.md#^0b927e)
        [alt text](file.md#^0b927e)
      `,
      after: dedent`
        [[file#^0b927e]]
        [[file#^0b927e|^0b927e]]
        [[file#^0b927e|alt text]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When a markdown link is more than just the basename, the file is converted correctly',
      before: dedent`
        [](nested/file.md#^0b927e)
        [](nested/file.md#header%20name)
        [](nested/file.md)
        [alias 1](nested/file.md#^0b927e)
        [alias 2](nested/file.md#header%20name)
        [alias 3](nested/file.md)
      `,
      after: dedent`
        [[nested/file#^0b927e]]
        [[nested/file#header name]]
        [[nested/file]]
        [[nested/file#^0b927e|alias 1]]
        [[nested/file#header name|alias 2]]
        [[nested/file|alias 3]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When a markdown link is just header or paragraph reference, it is converted to the proper wiki link',
      before: dedent`
        [](#header%20name)
        [alt text](#header%20name)
        [](#^0b927e)
        [alt text](#^0b927e)
      `,
      after: dedent`
        [[#header name]]
        [[#header name|alt text]]
        [[#^0b927e]]
        [[#^0b927e|alt text]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'Converts simple wiki links to markdown links',
      before: dedent`
        Here is a non-URL wiki link: [[not the file title]]
        Here is a wiki link with the same name as the file name [[file|file]]
      `,
      after: dedent`
        Here is a non-URL wiki link: ()[not-the-file-title.md]
        Here is a wiki link with the same name as the file name [file](./some-folder/file.md)
      `,
      options: {
        style: 'markdown',
        getFirstLinkpathDestString: createGetFirstLinkPathFunction(new Map<string, string>([
          ['not the file title', 'not-the-file-title.md'],
          ['file', './some-folder/file.md'],
        ])),
      },
    },
    // {
    //   testName: 'When markdown images are present, they are converted to wiki link images as well',
    //   before: dedent`
    //     [](file.md)
    //     [](https://github.com/)
    //     ![](image.jpg)
    //     [file2](file2.md)
    //     ![image alias](image2.jpg)
    //   `,
    //   after: dedent`
    //     [[file]]
    //     [[https://github.com/]]
    //     ![[image.jpg]]
    //     [[file2]]
    //     ![[image2.jpg|image alias]]
    //   `,
    //   options: {
    //     style: 'wiki',
    //   },
    // },
  ],
});

function createGetFirstLinkPathFunction(stringToPath: Map<string, string>): (text: string) => string {
  return (text: string) => {
    return stringToPath.get(text) ?? 'not found';
  };
}
