import { IResponse } from "./response";

export type ReporterType = 'json' | 'empty' | 'raw';

export interface IReporter {
	reset(): void;
	add(rule: string, message: string, line: number, start: number, end?: number): void;
	display(exit: boolean): void;
	log(exit: boolean): void;
	setPath(path: string): void;
	response: IResponse;
}
