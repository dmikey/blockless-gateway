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

export interface Pagination<Docs> {
	docs: Array<Docs>
	totalDocs: number
	limit: number
	totalPages: number
	page: number
	pagingCounter: number
	hasPrevPage: boolean
	hasNextPage: boolean
	prevPage: number | null
	nextPage: number | null
}

export type KeyValueObject = {
	[key: string]: string | null
}
