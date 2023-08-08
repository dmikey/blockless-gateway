import React from 'react'
import ReactDOM from 'react-dom/client'
import styled from 'styled-components'

const PageWrapper = styled.div`
	font-family: 'Inter', sans-serif;
	height: 100vh;
	background-color: #fff;

	display: flex;
	justify-content: center;
	align-items: center;
`

const PageInner = styled.div`
	line-height: 1.5;

	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-width: 480px;
	padding: 1.5rem;
	margin: 1rem;

	background: #ffffff;
	border: 1px solid #e2e8f0;
	box-shadow:
		0px 1px 3px rgba(0, 0, 0, 0.1),
		0px 1px 2px -1px rgba(0, 0, 0, 0.1);
	border-radius: 8px;

	h1 {
		font-size: 1.5rem;
		line-height: 2rem;
	}

	h1,
	p {
		margin: 0;
	}

	small {
		font-size: 0.875rem;
		color: #64748b;
	}

	a {
		color: #0070f3;
	}
`

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<PageWrapper>
			<PageInner>
				<h1>404 Not Found</h1>
				<p>The requested deployment could not be found.</p>
				<small>
					If it's your deployment, check&nbsp;
					<a href="https://blockless.network/docs" target="_blank" rel="noopener noreferrer">
						Blockless documentation
					</a>
					&nbsp; for help.
				</small>
			</PageInner>
		</PageWrapper>
	</React.StrictMode>
)
