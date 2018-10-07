Limitations
***********

* dust inside html string attributes will not be parsed into separate nodes, only a single string node will be present
* whitespace tokens inside dust/html tags are skipped when lexing, thus if the AST needs to be re-printed, those whitespaces cannot be preserved and have to be assumed
