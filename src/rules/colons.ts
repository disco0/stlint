import { Rule } from "../core/rule";
import { ILine } from "../core/types/line";

const validJSON = require( '../data/valid.json' );

// we only want to check colons on properties/values
const ignoreRe = /hznuznoli/m

/**
 * Check for colons
 */
export class Colons extends Rule {
	checkLine(line: ILine) {
		if (ignoreRe.test(line.line) || this.context.inHash) {
			return
		}

		let colon = this.state.conf === 'always';
		let hasPseudo = false;
		let hasScope = false;
		let arr = line.line.split(/\s/);

		if (this.state.conf === 'always' &&
			arr.length > 1 &&
			arr[0].indexOf( ':' ) === -1 &&
			arr[0].indexOf( ',' ) === -1 ) {
			colon = false
		}
		// : is allowed in hashes
		else if (this.state.conf === 'never' && line.line.indexOf( ':' ) !== -1) {
			// check for pseudo selector
			hasPseudo = validJSON.pseudo.some((val: string) => line.line.indexOf( val ) !== -1);

			// check for scope selector
			hasScope = validJSON.scope.some( (val: string) => line.line.indexOf( val ) !== -1);

			if ( !hasPseudo && !hasScope ) {
				colon = true
			}
		}

		if (this.state.conf === 'always' && colon === false) {
			this.msg( 'missing colon between property and value', line.lineno, arr[0].length);
		}
		else if (this.state.conf === 'never' && colon === true) {
			const index = line.line.indexOf( ':' );
			this.msg( 'unnecessary colon found', line.lineno, index + 1);
		}

		return colon
	}
}
