import React from 'react'
import ReactDOM from 'react-dom/client'

import { Box, Flex, Text } from '@blocklessnetwork/ui-components'

import Base from '../components/Base'
import WalletMetamask from '../components/wallets/Metamask'

function LoginPage() {
	return (
		<Flex
			overflow="auto"
			justifyContent="center"
			alignItems="center"
			bgColor="#F7F7F7"
			w="100%"
			h="100vh"
		>
			<Box px={{ base: '5%' }}>
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
					<WalletMetamask />
				</Box>
			</Box>
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
