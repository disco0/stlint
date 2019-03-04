import { Rule } from "../core/rule";
import { ILine } from "../core/types/line";

// we only want to check semicolons on properties/values
const ignoreRe = /(^[*#.])|[&>/]|{|}|if|for(?!\w)|else|@block|@media|(}|{|=|,)$/igm

/**
 * @description check that selector properties are sorted accordingly
 * @param  {string} [line] curr line being linted
 * @return {boolean} true if in order, false if not
 */
export class Semicolons extends Rule {
	checkLine(line: ILine): void | boolean {
		if (ignoreRe.test(line.line.trim())) {
			return;
		}

		let
			semicolon,
			index = line.line.indexOf(';');

		if (this.state.conf === 'never' && index !== -1) {
			semicolon = true
		}

		// for reasons that perplex me, even when the first use
		// of this at the top returns true, sometimes the method
		// still runs, so we add this second ignoreCheck here to catch it
		if (this.state.conf === 'always' && !ignoreRe.test(line.line.trim())) {
			if (index === -1 &&
				line.line.indexOf( '}' ) === -1 &&
				line.line.indexOf( '{' ) === -1 ) {
				semicolon = false
			}
		}

		if (this.state.conf === 'never' && semicolon === true) {
			this.msg( 'unnecessary semicolon found', line.lineno, index);
		}
		else if (this.state.conf === 'always' && semicolon === false) {
			this.msg( 'missing semicolon', line.lineno, line.line.length);
		}

		return semicolon;
	}
}
