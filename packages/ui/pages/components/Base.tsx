import { ReactNode } from 'react'

import { BlocklessUIProvider, consoleTheme, extendTheme } from '@blockless/ui-components'

function Base({ children }: { children: ReactNode }) {
	const theme = extendTheme(consoleTheme)
	return <BlocklessUIProvider theme={theme}>{children}</BlocklessUIProvider>
}

export default Base
