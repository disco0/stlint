import { IRule } from "./types/rule";
import * as rules from "../rules";
import { INode } from "./types/ast/node";
import { Tree } from "./ast";
import { Runner } from "./runner";
import { Linter } from "../linter";
import { Line } from "./line";
import { Rule } from "./rule";
import { IReporter } from "./types/reporter";
import { lcfirst } from "./helpers/lcfirst";
import { splitLines } from "./helpers/splitLines";

export class Checker {
	readonly rulesListForNodes: IRule[];
	readonly rulesListForLines: IRule[];
	readonly rulesList: IRule[];

	constructor(readonly linter: Linter) {
		const
			rulesConstructors: Dictionary<typeof Rule> = <any>rules,
			rulesNames: string[] = Object.keys(rulesConstructors),
			config = linter.config;

		this.rulesList = rulesNames
				.filter(key => rulesConstructors[key].prototype instanceof Rule)
				.map((key: string): IRule => {
					let options = config.rules[lcfirst(key)];

					if (options === true && config.defaultRules[lcfirst(key)]) {
						options = config.defaultRules[lcfirst(key)];
					}

					return new (<any>rulesConstructors)[key](options)
				})
				.filter(rule => rule.state.enabled);

		this.rulesListForLines = this.rulesList.filter(rule => rule.checkLine);
		this.rulesListForNodes = this.rulesList.filter(rule => rule.checkNode);
	}

	/**
	 * Check whole AST
	 *
	 * @param ast
	 */
	checkASTRules(ast: Tree) {
		try {
			const runner = new Runner(ast, this.check);
			runner.visit(ast, null);

		} catch (e) {
			this.linter.reporter.add('parser', e.message, e.lineno || 1, 0);

		} finally {
			this.afterCheck();
		}
	}

	private check = (root: INode) => {
		const type = root.nodeName;

		this.rulesListForNodes.forEach((rule: IRule) => {
			if (rule.checkNode && rule.isMatchType(type)) {
				rule.checkNode(<INode>root);
			}
		})
	};

	/**
	 * Check line by line
	 * @param content
	 */
	checkLineRules(content: string) {
		try {
			const
				lines: Line[] = splitLines(content);

			lines
				.forEach((line, index) => {
					Rule.beforeCheckLine(line);
					this.rulesListForLines.forEach(rule => rule.checkLine && rule.checkLine(line, index, lines));
				});

		} catch (e) {
			this.linter.reporter.add('Line', e.message, e.lineno || 1, 0);

		} finally {
			this.afterCheck();
		}
	}

	/**
	 * After checking put errors in reporter
	 */
	private afterCheck() {
		const reporter: IReporter = this.linter.reporter;

		this.rulesList.forEach(rule => {
			rule.errors.forEach(msg => reporter.add.apply(reporter, msg));
			rule.clearErrors();
		});

		reporter.fillResponse();
	}
}
