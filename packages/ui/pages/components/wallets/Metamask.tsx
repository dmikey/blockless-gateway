import { Blockless, Box, Flex, Image, Link, Text } from '@blocklessnetwork/ui-components'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { fetchAuthChallenge, fetchAuthToken } from '../../actions/auth'

interface WalletMetamaskProps {
	onLogin: (jwt: string | null) => void
	onLoading: () => void
}

export default function WalletMetamask({ onLogin, onLoading }: WalletMetamaskProps) {
	const [isAvailable, setIsAvailable] = useState(false)

	// Check availability for Metamask
	useEffect(() => {
		if ((window as any).ethereum) {
			setIsAvailable(true)
		} else {
			console.warn('Metamask not found. Please install Metamask extension.')
			setIsAvailable(false)
		}
	}, [])

	// Handle login
	const handleLogin = async () => {
		onLoading()
		const provider = new ethers.BrowserProvider((window as any).ethereum)

		try {
			const signer = await provider.getSigner()
			const account = await signer.getAddress()
			const nonce = await fetchAuthChallenge(account)
			const signature = await signer.signMessage(`unique nonce ${nonce}`)
			const jwt = await fetchAuthToken(account, signature)

			onLogin(jwt)
		} catch (error) {
			console.error('Error connecting to Metamask:', error)
			onLogin(null)
		}
	}

	return (
		<Flex py="4" alignItems="center" justifyContent="space-between">
			<Flex alignItems="center">
				<Image src="/metamask.svg" alt="Metamask" />
				<Text ml="4" fontSize="14px" fontWeight="600" color="brand.wallet">
					MetaMask
				</Text>
			</Flex>
			<Box>
				{isAvailable ? (
					<Box>
						<Blockless.Button variant="filled" onClick={handleLogin}>
							Connect
						</Blockless.Button>
					</Box>
				) : (
					<Box>
						<Link
							target="_blank"
							_hover={{ textDecoration: 'none' }}
							href="https://metamask.io/download/"
						>
							<Blockless.Button variant="outlined">Install</Blockless.Button>
						</Link>
					</Box>
				)}
			</Box>
		</Flex>
	)
}
