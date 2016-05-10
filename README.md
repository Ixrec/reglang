# reglang
A simple, readable pattern matching language intended to be compiled to regular expressions.

For example, when using [the proof of concept grammar](https://github.com/Ixrec/reglang/blob/master/grammar.peg.js) in [the online peg.js demo](http://pegjs.org/online), this snippet of reglang:
```
from linestart to lineend match caseinsensitive {
    0to1 "-" and
    1orMore digit and
    0to1 { "." and 0orMore digit } and
    0to1 { 
        "e" and
        0to1 ["+", "-"] and
        1orMore digit
    }
}
```
compiles to this regular expression:
```
/^-?\d+(?:\.\d*)?(?:e[+\-]?\d+)?$/i
```

## Demonstration
(under construction) https://ixrec.github.io/reglang/
