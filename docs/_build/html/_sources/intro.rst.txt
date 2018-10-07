============
Introduction
============

Dust Html Lexer Parser is a javascript library to lex and parse dust files containing html templates. Given an input stream, Dust Html Lexer Parser can be used to both lex the stream into a token vector, as well as parse the stream into an AST.
This lexer parser is built on top of the `chevrotain <http://sap.github.io/chevrotain/docs/>`_ library.

Why?
====

This is different than the dust parser provided by the dustjs library. Not only is this faster than the parser used in dustjs, but html is also parsed as part of the AST outputted (the dustjs parser simply parses html as string buffers).

Areas This Addresses
====================

* Lexes html + dust into tokens
* Parses html + dust into an AST
* Faster than parser used by dustjs library


Prior Art
=========

* `dustjs <http://www.dustjs.com/>`_
* `dustjs github <https://github.com/linkedin/dustjs>`_
