Parsing
*******

Validating Input
================
Use the parse function to validate input and produce a CST. This lower level function is provided for use cases in which performance is a concern or a full AST is simply not needed (input validation, for example).

.. js:autofunction:: index.parse

As an example:

.. code-block:: js

  import { parse } from 'dust-html-lexer-parser';

  const rootCstNode = parse('input string');

Producing an AST
================
In most cases, you not only need to validate input, but also produce an AST that can be traversed. For this use case, the ``toAst`` function is provided.

.. js:autofunction:: toAst

As an example:

.. code-block:: js

  import { toAst } from 'dust-html-lexer-parser';

  const rootNode = toAst('input string');
