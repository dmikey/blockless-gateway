export enum FunctionType {
	FUNCTION = 'function',
	SITE = 'site'
}

export enum FunctionStatus {
	PENDING = 'pending',
	BUILDING = 'building',
	PREPARING = 'preparing',
	DEPLOYING = 'deploying',
	FAILED = 'failed',
	DEPLOYED = 'deployed',
	STOPPED = 'stopped'
}

export const FunctionTypes = [FunctionType.FUNCTION, FunctionType.SITE]
export const FunctionStatuses = [
	FunctionStatus.PENDING,
	FunctionStatus.BUILDING,
	FunctionStatus.PREPARING,
	FunctionStatus.DEPLOYING,
	FunctionStatus.FAILED,
	FunctionStatus.DEPLOYED,
	FunctionStatus.STOPPED
]
