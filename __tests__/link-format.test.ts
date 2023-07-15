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
        Here is a markdown link: [[https://github.com/]]
        Here is a non-URL markdown link: [[file.md|not the file title]]
        Here is a markdown link with the same name as the file name [[./some-folder/file.md]]
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
        [[file.md]]
        [[https://github.com/]]
      `,
      options: {
        style: 'wiki',
      },
    },
    {
      testName: 'When markdown images are present, they are converted to wiki link images as well',
      before: dedent`
        [](file.md)
        [](https://github.com/)
        ![](image.jpg)
        [file2](file2.md)
        ![image alias](image2.jpg)
      `,
      after: dedent`
        [[file.md]]
        [[https://github.com/]]
        ![[image.jpg]]
        [[file2.md]]
        ![[image2.jpg|image alias]]
      `,
      options: {
        style: 'wiki',
      },
    },
  ],
});
