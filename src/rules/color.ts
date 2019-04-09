import { Rule } from '../core/rule';
import { IState } from '../core/types/state';
import { Call, RGB } from '../core/ast/index';

interface IColorState extends IState {
	allowOnlyInVar?: boolean
	denyRBG?: boolean
}

/**
 * Process all color values. Allow or deny use it not in variable and use uppercase or lowercase statements
 * For example this code has error - because we use only color in `uppercase`
 * ```stylus
 * .test
 * 	color #ccc
 * ```
 * If `allowOnlyInVar` === true code above also has error - no use color without variable
 *
 * Fixed code
 * ```stylus
 * $color = #CCC
 * .test
 * 	color $color
 * ```
 */
export class Color extends Rule<IColorState> {
	nodesFilter: string[] = ['rgb', 'call'];

	checkNode(node: RGB | Call): void | boolean {
		if (node instanceof Call) {
			return this.checkRGB(node);
		}

		const checkReg = this.state.conf !== 'lowercase' ? /[a-z]/ : /[A-Z]/;
		let fixed = false;

		if (this.state.allowOnlyInVar && node.closest('block')) {
			const fix = this.context.valueToVar[node.value] ||
				this.context.valueToVar[node.value.toLowerCase()] ||
				this.context.valueToVar[node.value.toUpperCase()];

			this.msg(
				'Set color only in variable' + (fix ? `(${fix})` : ''),
				node.lineno, node.column,
				node.column + node.value.length - 1,
				fix || null
			);

			fixed = !!fix;
		}

		if (node.value && typeof node.value === 'string' && checkReg.test(node.value)) {
			const fix = node.value.toString();

			this.msg(
				`Only ${ this.state.conf } HEX format`,
				node.lineno,
				node.column,
				node.column + node.value.length - 1,
				fixed ? null : this.state.conf === 'uppercase' ? fix.toUpperCase() : fix.toLowerCase()
			);

			return true;
		}

		return false;
	}

	private RGBToHex(...args: [number, number, number]): string {
		return '#' + args.map((c) => {
			let
				hex = c.toString(16);

			if (hex.length === 1) {
				hex = '0' + hex;
			}

			return hex;
		}).join('');
	}

	/**
	 * Check using rgba and rgb notation
	 * @param node
	 */
	private checkRGB(node: Call): void {
		if (this.state.denyRGB) {
			if (node.key && /^rgb(a)?$/i.test(node.key)) {
				let fix = '';

				const hex = this.RGBToHex(
					parseInt(node.nodes[0] ? node.nodes[0].toString() : '0', 10),
					parseInt(node.nodes[1] ? node.nodes[1].toString() : '0', 10),
					parseInt(node.nodes[2] ? node.nodes[2].toString() : '0', 10)
				);

				if (node.key === 'rgb') {
					fix = hex;
				} else {
					fix = `rgba(${hex}, ${node.nodes[4] ? node.nodes[4].toString() : '1'})`;
				}

				const
					line = node.line,
					endIndex = line ? line.line.indexOf(')', node.column - 1) + 1 : node.column + node.key.length - 1;

				this.msg(
					'Deny rgb/rgba format',
					node.lineno,
					node.column,
					endIndex,
					fix
				);
			}
		}
	}
}
