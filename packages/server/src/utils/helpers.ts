export class File extends Blob {
	name: string

	constructor(blobParts: BlobPart[], name: string) {
		super(blobParts)
		this.name = name
	}
}
