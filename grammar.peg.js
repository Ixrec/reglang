start
  = [ \t\n]* definitions [ \t\n]+ body:body [ \t\n]*
    { return body; }
  / [ \t\n]* body:body [ \t\n]*
    { return body; }
definitions
  = definition [ \t\n]+ definitions
  / definition
definition
  = "define" [ \t\n]+ chars:[A-Za-z]+ [ \t\n]+ exprs:expressions
    { userDefines[chars.join("")] = exprs; }
body
  = from:from_clause [ \t\n]+ to:to_clause [ \t\n]+ match:match_clause
    { return { match: match, from: from, to: to } }
  / match:match_clause
    { return { match: match } }
from_clause
  = "from" [ \t\n]+ locator:start_locator
    { return locator; }
start_locator
  = "anywhere" { return "anywhere"; }
  / "linestart" { return "linestart"; }
to_clause
  = "to" [ \t\n]+ locator:end_locator
    { return locator; }
end_locator
  = "anywhere" { return "anywhere"; }
  / "lineend" { return "lineend"; }
match_clause
  = "match" [ \t\n]* settings:match_settings [ \t\n]* "{" [ \t\n]+ exprs:expressions [ \t\n]* "}"
    { return { ast: exprs, settings: settings.join("") }; }
  / "match" [ \t\n]+ "{" [ \t\n]* exprs:expressions [ \t\n]* "}"
    { return { ast: exprs }; }
match_settings
  = lhs:match_setting [ \t\n]+ rhs:match_settings
    { return lhs.concat(rhs); }
  / setting:match_setting
    { return setting; }
match_setting
  = "caseinsensitive" { return ["i"]; }
  / "casesensitive" { return []; }
  / "global" { return ["g"]; }
  / "multiline" { return ["m"]; }
expressions
  = expr:expression [ \t\n]+ "and" [ \t\n]+ exprs:expressions { return { conjunction: { lhs: expr, rhs: exprs } };}
  / expr:expression [ \t\n]+ "or" [ \t\n]+ exprs:expressions { return { disjunction: { lhs: expr, rhs: exprs } };}
  / expr:expression { return expr;}
expression
  = quantifier:quantifier [ \t\n]+ block:block
    { return { quantifier: quantifier.quantifier, block: block.block, qualifiers: block.qualifiers }; }
  / block:block
    { return { block: block.block, qualifiers: block.qualifiers }; }
  / quantifier:quantifier [ \t\n]+ set:set
    { return { quantifier: quantifier.quantifier, set: set.set }; }
  / set:set
    { return { set: set.set }; }
  / quantifier:quantifier [ \t\n]+ literal:literal
    { return { quantifier: quantifier.quantifier, literal: literal.literal }; }
  / literal:literal
    { return { literal: literal.literal }; }
  / quantifier:quantifier [ \t\n]+ ident:user_defined
    {
      var obj = {};
      obj.quantifier = quantifier.quantifier;
      var type = Object.keys(ident)[0];
      obj[type] = ident[type];
      return obj;
    }
  / ident:user_defined
    { return ident; }
block
  = qualifiers:block_qualifiers [ \t\n]* "{" [ \t\n]* exprs:expressions [ \t\n]* "}"
    { return { block: exprs, qualifiers: qualifiers }; }
  / "{" [ \t\n]* exprs:expressions [ \t\n]* "}"
    { return { block: exprs }; }
block_qualifiers
  = lhs:block_qualifier [ \t\n]+ rhs:block_qualifiers
    { return lhs.concat(rhs); }
  / qualifier:block_qualifier
    { return qualifier; }
block_qualifier
  = "capture" { return ["capture"]; }
  / "positive_lookahead" { return ["positive_lookahead"]; }
  / "negative_lookahead" { return ["negative_lookahead"]; }
quantifier
  = quantifier:quantifier_range [ \t\n]+ "lazy"
    {
      var quantifier = quantifier.quantifier;
      quantifier.lazy = true;
      return { quantifier: quantifier };
    }
  / quantifier:quantifier_range
    { return { quantifier: quantifier.quantifier }; }
quantifier_range
  = leftDigits:[0-9]+ "orMore"
    { return {
      quantifier: { lower: parseInt(leftDigits.join(""), 10),
                    upper: Infinity }};
    }
  / leftDigits:[0-9]+ "to" rightDigits:[0-9]+
    { return {
      quantifier: { lower: parseInt(leftDigits.join(""), 10), 
                    upper: parseInt(rightDigits.join(""), 10) }
    };}
set
  = "not" [ \t\n]+ set:set
    {
      if(set.set) {
        return { negatedSet: set.set };
      }
    }
  / "[" [ \t\n]* elements:set_elements [ \t\n]* "]"
    {
      var set = [];
      for(var i = 0; i < elements.length; ++i) {
        if(elements[i].literal) {
          set = set.concat(elements[i].literal);
        }
      }
      return {
        set: set
      };
    }
set_elements
  = element:set_element [ \t\n]* "," [ \t\n]* more_elements:set_elements
    { return [ element ].concat(more_elements); }
  / element:set_element
    { return [ element ]; }
set_element
  = literal
literal
  = "\"" chars:[^"]* "\""
    { return {
      literal: chars
    };}
  / "digit"      { return { literal: ["\\d"] }; }
  / "whitespace" { return { literal: ["\\s"] }; }
  / "wordchar"   { return { literal: ["\\w"] }; }
  / "char"       { return { literal: ["CHAR"] }; }
user_defined
  = char:[A-Z] chars:[A-Za-z]*
    {
      var id = char + chars.join("");
      if(userDefines[id]) { return userDefines[id]; }
      throw new Error("Undefined symbol: '" + id + "'");
    }