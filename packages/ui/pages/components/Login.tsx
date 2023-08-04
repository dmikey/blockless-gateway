import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { Box, Flex, Text, toast } from '@blockless/ui-components'

import Base from './Base'
import WalletLoading from './wallets/Loading'
import WalletMetamask from './wallets/Metamask'

function LoginPage() {
	const [returnUrl, setReturnUrl] = useState<string | null>(null)
	const [loadingState, setLoadingState] = useState<'loading' | 'redirecting' | null>(null)

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search || '')
		setReturnUrl(searchParams.get('redirect'))
	}, [])

	const handleLoading = () => {
		setLoadingState('loading')
	}

	const handleLogin = (jwt: string | null) => {
		if (!jwt) {
			toast({
				title: 'Authorization Failed',
				message: "We've failed to authorize you. Please try again later.",
				type: 'error'
			})
			setLoadingState(null)
		} else {
			setLoadingState('redirecting')

			if (returnUrl) {
				window.location.href = `${returnUrl}/${jwt}`
			} else {
				window.location.href = '/'
			}
		}
	}

	return (
		<Flex
			overflow="auto"
			justifyContent="center"
			alignItems="center"
			bgColor="#F7F7F7"
			w="100%"
			h="100vh"
		>
			{loadingState !== null && (
				<WalletLoading
					walletType={'metamask'}
					reloading={false}
					redirecting={loadingState === 'redirecting'}
				/>
			)}

			{loadingState === null && (
				<Box px={{ base: '5%', display: 'none' }}>
					<Text
						fontWeight="semibold"
						color="brand.header"
						fontSize={{ base: '22px', md: '30px' }}
						cursor="default"
					>
						Login with Crypto Wallet
					</Text>

					<Text my="3" color="brand.text" cursor="default">
						If you don't have a crypto wallet yet, select a provider and create one now.
					</Text>

					<Box mt="8" mb={{ base: '10', lg: '5' }} bg="white" borderRadius="8px" px="5">
						<WalletMetamask onLogin={handleLogin} onLoading={handleLoading} />
					</Box>
				</Box>
			)}
		</Flex>
	)
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Base>
			<LoginPage />
		</Base>
	</React.StrictMode>
)
