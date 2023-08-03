import { BlocklessUIProvider, consoleTheme, extendTheme } from '@blocklessnetwork/ui-components'

function Base({ children }: { children: any }) {
	const theme = extendTheme(consoleTheme)
	return <BlocklessUIProvider theme={theme}>{children}</BlocklessUIProvider>
}

export default Base
