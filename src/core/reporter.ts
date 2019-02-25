import { IReporter } from "./types/reporter";
import { IMessagePack} from "./types/message";
import { IResponse } from "./types/response";
import { inspect } from 'util'

export class Reporter implements IReporter {
	errors: IMessagePack[] = [];
	constructor(readonly path: string) {}

	private static __instance: IReporter | null = null;

	static getInstance(path: string, type: string): IReporter {
		if (!Reporter.__instance) {
			switch (type) {
				case 'emptyout':
					Reporter.__instance = new EmptyOut(path);
					break;
				default:
					Reporter.__instance = new Reporter(path);
			}
		}

		return Reporter.__instance;
	}

	/**
	 *
	 * @param message
	 * @param line
	 * @param start
	 * @param end
	 */
	add(message: string, line: number = 0, start: number = 0, end: number = 0) {
		this.errors.push({
			message: [{
				descr: message,
				path: this.path,
				line,
				endline: line,
				start,
				end: end > start ? end : start + 1
			}]
		});
	}

	protected log(response: IResponse) {
		console.log(JSON.stringify(response));
	}

	response: IResponse = {
		passed: true
	};

	display() {
		if (this.errors.length) {
			this.response.passed = false;
			this.response.errors = this.errors;
		}

		this.log(this.response);
	}

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

import { EmptyOut } from "./reporters/emptyOut";
