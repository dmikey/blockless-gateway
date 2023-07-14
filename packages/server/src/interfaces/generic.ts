export interface IDocument {
	_id: string

	createdAt?: string
	updatedAt?: string
}

export interface INameValue {
	name: string
	value: string
}

export type INameValueArray = INameValue[]
