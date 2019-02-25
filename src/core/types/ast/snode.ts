export interface ISNode {
	lineno: number;
	column: number;

	block?: ISNode | null;
	nodeName: string;
	path?: string;
	name?: string;
	string?: string;
	expr?: ISNode;
	val?: ISNode;

	nodes: ISNode[];
	args?: ISNode;
	vals?: Dictionary<ISNode>;

	[key: string]: unknown;
	toString(): string;
}
