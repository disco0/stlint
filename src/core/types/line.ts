export interface ILine {
	line: string;
	lineno?: number;
	lines?: ILine[];
	next(): null | ILine;
}
