import { IReporter } from "./types/reporter";
import { IMessagePack } from "./types/message";
import { IResponse } from "./types/response";
import { inspect } from 'util'

export abstract class Reporter implements IReporter {
	errors: IMessagePack[] = [];

	private path: string = '';

	/**
	 * Set current working file
	 * @param path
	 */
	setPath(path: string) {
		this.path = path;
	}

	protected constructor(readonly options: Dictionary) {}

	private static __instance: IReporter | null = null;

	static getInstance(type: string, config: Dictionary): IReporter {
		if (!Reporter.__instance) {
			switch (type) {
				case 'json':
					Reporter.__instance = new JsonReporter(config);
					break;

				case 'silent':
					Reporter.__instance = new SilentReporter(config);
					break;

				default:
					Reporter.__instance = new RawReporter(config);
			}
		}

		return Reporter.__instance;
	}

	/**
	 * Add new error in message pull
	 * @param rule
	 * @param message
	 * @param line
	 * @param start
	 * @param end
	 * @param fix
	 */
	add(rule: string, message: string, line: number = 0, start: number = 0, end: number = 0, fix: string | null = null) {
		this.errors.push({
			message: [{
				rule,
				descr: message,
				path: this.path,
				line,
				endline: line,
				start,
				end: end > start ? end : start,
				fix: typeof fix === 'string' ? {replace: fix} : null
			}]
		});
	}

	/**
	 * Output data some methods
	 */
	abstract log(): void;

	response: IResponse = {
		passed: true
	};

	/**
	 * Fill response object
	 */
	fillResponse() {
		if (this.errors.length) {
			this.response.passed = false;
			this.response.errors = this.errors;
		}
	}

	/**
	 * Prepare data and output result
	 * @param exit
	 */
	display(exit: boolean) {
		this.fillResponse();
		this.log();
		this.reset();
		if (exit) {
			process.exit(this.response.passed ? 0 : 1);
		}
	}

	/**
	 * Reset all error stores
	 */
	reset() {
		this.errors.length = 0;
		this.response = {
			passed: true
		};
	}
}

export const log = (val: any) => console.log(inspect(val, {
	depth: 10
}));

import { SilentReporter } from "./reporters/silentReporter";
import { RawReporter } from "./reporters/rawReporter";
import { JsonReporter } from "./reporters/jsonReporter";
