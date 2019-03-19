import { Glob } from "glob"
import { readFileSync, readFile, writeFileSync } from "fs";
// @ts-ignore
import * as ts from "typescript";
import { Config } from "./config";
import { lcfirst } from "./core/helpers/lcfirst";
import { State } from "./core/types/state";

type RuleDocs = {
	name: string;
	description: string;
	default: State;
}

export const doc = () => {
	console.log('Documentation generator start');

	const
		config = new Config({}),
		result: RuleDocs[] = [];

	function delint(sourceFile: ts.SourceFile) {
		delintNode(sourceFile);

		function delintNode(node: ts.Node) {
			switch (node.kind) {
				case ts.SyntaxKind.ClassDeclaration: {
					const
						ruleName = lcfirst(node.name.escapedText);

					result.push({
						name: ruleName,
						description: (node.jsDoc && node.jsDoc[0]) ? node.jsDoc[0].comment : '',
						default: config.defaultRules[ruleName]
					});

					break;
				}
			}

			ts.forEachChild(node, delintNode);
		}
	}

	new Glob('./src/rules/*.ts', {}, async (err: Error | null, files: string[]) => {
		if (err) {
			throw err
		}

		files.forEach(async (file) => {
			const match = /\/(\w+)\.ts/.exec(file);

			if (match) {
				const rule = match[1];
				if (rule !== 'index') {


					let sourceFile = ts.createSourceFile(
						file,
						readFileSync(file).toString(),
						ts.ScriptTarget.ES2018,
						/*setParentNodes */ true
					);


					delint(sourceFile);
				}
			}
		});

		const readmeFile = process.cwd() + '/readme.md';
		readFile(readmeFile, 'utf-8', (err, readme: string) => {
			if (err) {
				throw err
			}

			const text = result.map((item: RuleDocs) => {
				return `###${item.name}\n` +
					`${item.description}\n` +
					'####Default value\n' +
					'```json\n' +
					`${JSON.stringify(item.default)}\n` +
					'```\n'
					;
			}).join('');

			readme = readme.replace(/<!-- RULES START -->(.*)<!-- RULES END -->/msg, `<!-- RULES START -->${text}<!-- RULES END -->`);

			writeFileSync(readmeFile, readme);
			console.log('Documentation generator finish');

		});
	});
};
