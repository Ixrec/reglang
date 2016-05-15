document.addEventListener("DOMContentLoaded", scheduleRegexGeneration);

function scheduleRegexGeneration() {
	var prevReglang = '';
	var prevMatchesRaw = '';
	var regexPattern;
	var regexFlags;

	function update() {
		setTimeout(update, 500);
		var reglang = document.getElementById("reglang-input").value;
		var reglangChanged = prevReglang !== reglang;
		if(reglangChanged) {
			prevReglang = reglang;
			var regexArgs;
			try {
				regexArgs = updateRegex(reglang);
			} catch(e) {
				console.log(e);
				return;
			}
			regexPattern = regexArgs.string;
			regexFlags = regexArgs.settings;
		}
		var rawMatches = document.getElementById("matches-input").value;
		if(reglangChanged || prevMatchesRaw !== rawMatches) {
			prevMatchesRaw = rawMatches;
			var testCases = rawMatches.split('\n').filter(c => !!c);
			updateTestMatches(regexPattern, regexFlags, testCases);
		}
	}
	update();
}

function updateRegex(reglangInput){
	var parseTree = parser.parse(reglangInput);

	var core = ASTtoRegEx(parseTree.match.ast);
	var regex = "";
    if(parseTree.from === "linestart") { regex += "^"; }
	regex += core;
    if(parseTree.to === "lineend") { regex += "$"; }

	var regexArgs = { string: regex, settings: parseTree.match.settings };
	console.log("Generated regexArgs: " + JSON.stringify(regexArgs, null, 4));
	document.getElementById("regex-pattern-output").textContent = regexArgs.string.replace(/ /g, '&nbsp;');
	document.getElementById("regex-flags-output").textContent = regexArgs.settings.replace(/ /g, '&nbsp;');
	return regexArgs;
};

function updateTestMatches(pattern, flags, testCases) {
	var regexObject = new RegExp(pattern, flags);
	console.log("testCases: " + testCases);
	var testResults = testCases.map(str => regexObject.test(str));
	console.log("testResults: " + testResults);

	var resultsElem = document.getElementById("match-output");
	while (resultsElem.firstChild) { resultsElem.removeChild(resultsElem.firstChild); }
	testResults.forEach(function(result) {
		var node = document.createElement('div');
		node.textContent = result;
		resultsElem.appendChild(node);
	});	
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
