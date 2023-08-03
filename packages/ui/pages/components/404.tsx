import React from 'react'
import ReactDOM from 'react-dom/client'

import Base from './Base'

function App() {
	return <div>Not Found</div>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Base>
			<App />
		</Base>
	</React.StrictMode>
)
