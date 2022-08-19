const { deployments, ethers, getNamedAccounts, network } = require('hardhat')
const { expect, assert } = require('chai')
const { developmentChains } = require('../../helper-hardhat-config')

developmentChains.includes(network.name)
	? describe.skip
	: describe('FundMe', async function () {
			let fundMe, deployer
			const sendValue = 10000000000000000

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer
				fundMe = await ethers.getContract('FundMe', deployer)
			})

			it('Allows withdrawal ETH', async function () {
				const startFundingBalance = await fundMe.provider.getBalance(
					fundMe.address
				)
				const startDeployerBalance = await fundMe.provider.getBalance(
					deployer
				)

				await fundMe.fund({ value: sendValue })
				await fundMe.withdraw()

				const { gasUsed, effectiveGasPrice } = receipt
				const gasCost = gasUsed.mul(effectiveGasPrice)

				const endFundingBalance = await fundMe.provider.getBalance(
					fundMe.address
				)
				assert.equal(endFundingBalance.toString(), '0')
			})
	  })
