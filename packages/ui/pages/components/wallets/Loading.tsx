import { motion } from 'framer-motion'

import { Text, VStack } from '@blocklessnetwork/ui-components'

interface LoadingProps {
	walletType: 'metamask' | 'keplr' | 'martianWallet'
	reloading: boolean
	redirecting: boolean
}

export default function WalletLoading({ walletType, reloading, redirecting }: LoadingProps) {
	if (reloading || redirecting) {
		return (
			<VStack spacing={5}>
				<Text color="primary.gray.1" fontSize="14px" fontWeight={400}>
					{redirecting ? 'Redirecting' : 'Authenticating'}
				</Text>
				<div className="dot-collision" />
			</VStack>
		)
	} else {
		return (
			<VStack spacing={5}>
				<motion.img
					animate={{
						scale: [1, 1.2, 1]
					}}
					transition={{ repeat: Infinity }}
					src={`./${walletType}.svg`}
					alt={walletType}
				/>
				<Text color="primary.gray.1" fontSize="16px" fontWeight={400}>
					Continue in <span style={{ textTransform: 'capitalize' }}>{walletType}</span>
				</Text>
			</VStack>
		)
	}
}
