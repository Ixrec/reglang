document.addEventListener("DOMContentLoaded", generateRegex);

document.getElementById('generate').addEventListener("click", generateRegex);

function generateRegex(){
	var reglangInput = document.getElementById("reglang-input").innerHTML;
	console.log(reglangInput);
	var parseTree = parser.parse(reglangInput);
	console.log(parseTree);
	var regexArgs = toRegex(parseTree);
	var output = JSON.stringify(regexArgs);

	document.getElementById("regex-output").innerHTML = output;

	var matchablesRaw = document.getElementById("matchables").innerHTML;
	var testCases = matchablesRaw.split('\n').filter(c => !!c);
	console.log(testCases);
	var regexObject = new RegExp(regexArgs.string, regexArgs.settings);
	var testResults = testCases.map(str => regexObject.test(str));

	document.getElementById("match-output").innerHTML = testResults.join('\n');
};

function toRegex(reglangAST) {
	var core = ASTtoRegEx(reglangAST.match.ast);
	var regex = "";
    if(reglangAST.from === "linestart") { regex += "^"; }
	regex += core;
    if(reglangAST.to === "lineend") { regex += "$"; }
	return { string: regex, settings: reglangAST.match.settings };
}

function ASTtoRegEx(exprs) {
	switch(Object.keys(exprs)[0]) {
	case "conjunction":
		return ASTtoRegEx(exprs.conjunction.lhs) + 
			ASTtoRegEx(exprs.conjunction.rhs);
		break;
	case "disjunction":
		return "(?:" + ASTtoRegEx(exprs.disjunction.lhs) + "|" +
			ASTtoRegEx(exprs.disjunction.rhs) + ")";
		break;
	case "quantifier":
		var lower = exprs.quantifier.lower;
		var upper = exprs.quantifier.upper;
		if(upper === Infinity) { upper = ''; }
		var suffix = "{" + lower + "," + upper + "}";
		if(suffix === "{0,}") { suffix = "*"; }
		else if(suffix === "{1,}") { suffix = "+"; }
		else if(suffix === "{0,1}") { suffix = "?"; }
		if(exprs.quantifier.lazy) { suffix += "?"; }
		var clone = {};
		Object.keys(exprs).forEach(function(key) {
			if(key !== "quantifier") { clone[key] = exprs[key]; }
		});
		return ASTtoRegEx(clone) + suffix;
		break;
	case "block":
		var inside = ASTtoRegEx(exprs.block);
		var quals = exprs.qualifiers || [];
		if(quals.indexOf("capture") !== -1) {
			return "(" + inside + ")";
		} else if(quals.indexOf("positive_lookahead") !== -1) {
			return "(?=" + inside + ")";
		} else if(quals.indexOf("negative_lookahead") !== -1) {
			return "(?!" + inside + ")";
		} else {
			return "(?:" + inside + ")";
		}
		break;
	case "set":
		var elems = exprs.set;
		for(var i = 0; i < elems.length; ++i) {
			if(elems[i].length === 1 &&
				 "-/[\]^".indexOf(elems[i]) !== -1) {
				elems[i] = "\\" + elems[i];
			}
		}
		return "[" + elems.join("") + "]";
	case "negatedSet":
		var elems = exprs.negatedSet;
		for(var i = 0; i < elems.length; ++i) {
			if("-/[\]^".indexOf(elems[i]) !== -1 &&
				 elems[i].length === 1) {
				elems[i] = "\\" + elems[i];
			}
		}
		return "[^" + elems.join("") + "]";
	case "literal":
		var chars = exprs.literal;
		for(var i = 0; i < chars.length; ++i) {
			if(".?+*\/|{}[]()".indexOf(chars[i]) !== -1 &&
				 chars[i].length === 1) {
				chars[i] = "\\" + chars[i];
			}
			if(chars[i] === "CHAR") chars[i] = ".";
		}
		return chars.join("");
		break;
	}
	throw new Error("Invalid AST: " + JSON.stringify(exprs));
}
var userDefines = {};
