import { IMessagePack } from "./message";

export interface IResponse {
	passed: boolean;
	errors?: Array<IMessagePack>;
}
