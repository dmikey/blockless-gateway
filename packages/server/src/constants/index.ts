export const API_PATH = 'api/v1'

export const REGEX_HOST_MATCH = new RegExp(
	`^(localhost(:\\d{1,5})?|localhost\\.\\w+(:\\d{1,5})?|127\\.0\\.0\\.1(:\\d{1,5})?|::1(:\\d{1,5})?|0:0:0:0:0:0:0:1(:\\d{1,5})?|0\\.0\\.0\\.0(:\\d{1,5})?|${process
		.env.SERVER_DOMAIN!})$`,
	'i'
)

export const REGEX_HOST_NOT_MATCH = new RegExp(
	`^(?!(localhost(:\\d{1,5})?|localhost\\.\\w+(:\\d{1,5})?|127\\.0\\.0\\.1(:\\d{1,5})?|::1(:\\d{1,5})?|0:0:0:0:0:0:0:1(:\\d{1,5})?|0\\.0\\.0\\.0(:\\d{1,5})?|${process
		.env.SERVER_DOMAIN!})$).*`,
	'i'
)
