Lexing
******

Use the lex function to lex an input stream into a token vector:

.. js:autofunction:: lex

As an example:

.. code-block:: js

  import { lex, tokenVocabulary } from 'dust-html-lexer-parser';

  // tokens is an array of lexed tokens from the tokenVocabulary
  const { tokens } = lex('input string');


Token Vocabulary
================

The token vocabulary definitions can be seen from the lexing code copied below. See `chevrotain lexing <http://sap.github.io/chevrotain/docs/tutorial/step1_lexing.html#introduction>`_ for documentation on how lexing tokens work.

.. note:: Whitespace tokens are skipped, meaning they will not show up in the produced token vector.

.. literalinclude:: ../src/lex/index.ts
  :language: typescript
