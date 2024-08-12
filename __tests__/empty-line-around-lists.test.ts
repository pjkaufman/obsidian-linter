import dedent from 'ts-dedent';
import {ruleTest} from './common';
import EmptyLineAroundLists from '../src/rules/empty-line-around-lists';

ruleTest({
  RuleBuilderClass: EmptyLineAroundLists,
  testCases: [
    {
      testName: 'Make sure multiple blank lines at the start and end are removed',
      before: dedent`
        ${''}
        ${''}
        - List item 1
          - Nested item 1
        - List item 2
        ${''}
        ${''}
      `,
      after: dedent`
        - List item 1
          - Nested item 1
        - List item 2
      `,
    },
    {
      testName: 'Make sure multiple blank lines at the start and end are removed when dealing with blockquotes or callouts',
      before: dedent`
        >
        > ${''}
        > - List item 1
        >  - Nested item 1
        > - List item 2
        > ${''}
        >
      `,
      after: dedent`
        > - List item 1
        >  - Nested item 1
        > - List item 2
      `,
    },
  ],
});
