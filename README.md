# RegLang

A simple, readable pattern matching language intended to be compiled to regular expressions.

For example, this snippet of RegLang for matching numeric literals:
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
Try the interactive demo at https://ixrec.github.io/reglang/

Even if you have a lot of experience with regular expressions, I hope we can agree the RegLang version has a significant readability advantage.

# Motivation

For simple patterns, regular expressions are often far more straightforward than doing string manipulation by hand, but regular expressions very quickly become an unreadable mess, not to mention the various "flavors" of regular expression are notoriously incompatible with each other, despite often having similar feature sets.

RegLang is meant to be more readable than regular expressions, but still far more straightforward for pattern matching tasks than manipulating the string yourself. Since the functionality of regular expessions leaves little to be desired, RegLang is implemented by compiling to regular expressions.

Since I got the idea when I was rereading _Javascript: The Good Parts_, I'll quote that:

> The rules for writing regular expressions can be surprisingly complex because they interpret characters in some positions as operators, and in slightly different positions as literals. Worse than being hard to write, this makes regular expressions hard to read and dangerous to modify. … regular expressions can be very difficult to maintain and debug. … [they] tend to be extremely terse, even cryptic. They are easy to use in their simplest form, but they can quickly become bewildering. … All the parts of a regular expression are pushed tightly together, making them almost indecipherable. This is a particular concern when they are used in security applications for scanning and validation. If you cannot read and understand a regular expression, how can you have confidence that it will work correctly for all inputs? Yet, despite their obvious drawbacks, regular expressions are widely used.

He's right, and we can do better than this.

# Project Status

Under [Walker's proposed terminology](http://walkercoderanger.com/blog/2015/06/advice-for-open-source-projects/), this project is "Works for Me" and "Inactive", meaning I just threw this together on a whim (and to learn peg.js) and I have no idea if anyone will ever actually use it, but I will be pleasantly surprised and responsive if someone submits a bug, issue, comment or PR.

The "RegLang Draft 2.odt" file in this repository contains all the thoughts and ideas I had on this subject after two days of scribbling random things down, including many things I never bothered to implement and thus aren't in the interactive demo. I'm no longer doing any work on this, so if it's not in that document, I probably haven't thought of it.
