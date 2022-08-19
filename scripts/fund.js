const { deployments, ethers, getNamedAccounts, network } = require('hardhat')

async function main() {
	const { deployer } = await getNamedAccounts()
	const fundMe = await ethers.getContract('FundMe', deployer)
	console.log('Funding contract')
	const transactionResponse = await fundMe.fund({
		value: ethers.utils.parseEther('1'),
	})
	await transactionResponse.wait(1)
	console.log('Funded!')
}

main()
	.then(() => {
		console.log('Done')
	})
	.catch((ex) => {
		console.error('Error', ex)
	})
