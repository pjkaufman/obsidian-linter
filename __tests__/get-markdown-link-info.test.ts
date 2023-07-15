import {LinkInfo, getMarkdownLinkInfo} from '../src/utils/mdast';
import dedent from 'ts-dedent';

type markdownLinkInfoTestCase = {
  name: string,
  text: string,
  expectedMarkdownLinksInText: number,
  expectedInfo: LinkInfo[]
};

const getMarkdownLinkInfoTestCases: markdownLinkInfoTestCase[] = [
  {
    name: 'When no markdown links are present, no results are returned for markdown link info',
    text: dedent`
      Here is some text
      Here is a link: https://github.com/
    `,
    expectedMarkdownLinksInText: 0,
    expectedInfo: [],
  },
  {
    name: 'When no markdown links are present and a markdown image is present, no results are returned for markdown link info',
    text: dedent`
      Here is some text
      Here is a link: https://github.com/
      Here is an image link: ![](image.jpg)
    `,
    expectedMarkdownLinksInText: 0,
    expectedInfo: [],
  },
  {
    name: 'When a markdown link is present, its position and info are properly parsed out',
    text: dedent`
      Here is some text
      Here is a markdown link: [github.com](https://github.com/)
    `,
    expectedMarkdownLinksInText: 1,
    expectedInfo: [{
      text: 'github.com',
      link: 'https://github.com/',
      position: {
        startIndex: 43,
        endIndex: 76,
      },
    }],
  },
  {
    name: 'When multiple markdown links are present, their positions and info are properly parsed out',
    text: dedent`
      Here is some text
      Here is a markdown link: [github.com](https://github.com/)
      More text here
      [markdown file](markdown%20file.md)
    `,
    expectedMarkdownLinksInText: 2,
    expectedInfo: [{
      text: 'markdown file',
      link: 'markdown%20file.md',
      position: {
        startIndex: 92,
        endIndex: 127,
      },
    },
    {
      text: 'github.com',
      link: 'https://github.com/',
      position: {
        startIndex: 43,
        endIndex: 76,
      },
    }],
  },
];

describe('Get Markdown Link Info for Text', () => {
  for (const testCase of getMarkdownLinkInfoTestCases) {
    it(testCase.name, () => {
      const markdownLinkInfo = getMarkdownLinkInfo(testCase.text);

      expect(markdownLinkInfo.length).toEqual(testCase.expectedMarkdownLinksInText);
      expect(markdownLinkInfo).toEqual(testCase.expectedInfo);
    });
  }
});
