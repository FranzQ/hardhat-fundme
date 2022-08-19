require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()
require('@nomiclabs/hardhat-etherscan')
require('hardhat-gas-reporter')
require('hardhat-deploy')
require('solidity-coverage')

const RPC_URL = process.env.RPC_URL_GOERLI
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
// const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: { compilers: [{ version: '0.8.9' }, { version: '0.6.6' }] },
	defaultNetwork: 'hardhat',
	networks: {
		goerli: {
			url: RPC_URL,
			accounts: [PRIVATE_KEY],
			chainId: 5,
			blockConfirmations: 6,
		},
		localhost: {
			url: 'http://127.0.0.1:8545/',
			chainId: 31337,
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		user: {
			default: 1,
		},
	},
	gasReporter: {
		enabled: true,
		outputFile: 'gas-report.txt',
		noColors: true,
		currency: 'USD',
		// coinmarketcap: COINMARKETCAP_API_KEY,
	},
}
