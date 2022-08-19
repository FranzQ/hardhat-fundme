const { deployments, ethers, getNamedAccounts } = require('hardhat')
const { expect, assert } = require('chai')
const { developmentChains } = require('../../helper-hardhat-config')

!developmentChains.includes(network.name)
	? describe.skip
	: describe('FundMe', async function () {
			let fundMe, deployer, mockV3Aggregator
			const sendValue = ethers.utils.parseEther('10')

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer
				await deployments.fixture(['all'])
				fundMe = await ethers.getContract('FundMe', deployer)
				mockV3Aggregator = await ethers.getContract(
					'MockV3Aggregator',
					deployer
				)
			})

			describe('constructor', async function () {
				it('Sets the aggregator addresses correctly', async function () {
					const response = await fundMe.getPriceFeed()
					assert.equal(response, mockV3Aggregator.address)
				})
			})

			describe('fund', async function () {
				it('Fails if enough eth is not sent', async function () {
					await expect(fundMe.fund()).to.be.revertedWith(
						'Minimum Insufficient'
					)
				})

				it('Updates the amount funded data structure', async function () {
					await fundMe.fund({ value: sendValue })
					const response = await fundMe.addressToAmountFunded(
						deployer
					)
					assert.equal(response.toString(), sendValue.toString())
				})

				it('Add funders to array', async function () {
					await fundMe.fund({ value: sendValue })
					const funder = await fundMe.funders(0)
					assert.equal(funder, deployer)
				})
			})

			describe('withdraw', async function () {
				beforeEach(async function () {
					await fundMe.fund({ value: sendValue })
				})

				it('Owner withdraws ETH', async function () {
					const startFundingBalance =
						await fundMe.provider.getBalance(fundMe.address)
					const startDeployerBalance =
						await fundMe.provider.getBalance(deployer)

					const response = await fundMe.withdraw()
					const receipt = await response.wait(1)

					const { gasUsed, effectiveGasPrice } = receipt
					const gasCost = gasUsed.mul(effectiveGasPrice)

					const endFundingBalance = await fundMe.provider.getBalance(
						fundMe.address
					)
					const endDeployerBalance = await fundMe.provider.getBalance(
						deployer
					)

					assert.equal(endFundingBalance, 0)
					assert.equal(
						startFundingBalance
							.add(startDeployerBalance)
							.toString(),
						endDeployerBalance.add(gasCost).toString()
					)
				})

				it('Allows us to withdraw with multiple funders', async function () {
					const accounts = await ethers.getSigners()
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = await fundMe.connect(
							accounts[i]
						)
						await fundMeConnectedContract.fund({ value: sendValue })
					}
					await fundMe.fund({ value: sendValue })
					const startFundingBalance =
						await fundMe.provider.getBalance(fundMe.address)
					const startDeployerBalance =
						await fundMe.provider.getBalance(deployer)

					const response = await fundMe.withdraw()
					const receipt = await response.wait(1)

					const { gasUsed, effectiveGasPrice } = receipt
					const gasCost = gasUsed.mul(effectiveGasPrice)

					const endFundingBalance = await fundMe.provider.getBalance(
						fundMe.address
					)
					const endDeployerBalance = await fundMe.provider.getBalance(
						deployer
					)

					assert.equal(endFundingBalance, 0)
					assert.equal(
						startFundingBalance
							.add(startDeployerBalance)
							.toString(),
						endDeployerBalance.add(gasCost).toString()
					)

					await expect(fundMe.funders(0)).to.be.reverted
					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.addressToAmountFunded(
								accounts[i].address
							),
							0
						)
					}
				})

				it('Allows cheap gas withdraw with multiple funders', async function () {
					const accounts = await ethers.getSigners()
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = await fundMe.connect(
							accounts[i]
						)
						await fundMeConnectedContract.fund({ value: sendValue })
					}
					await fundMe.fund({ value: sendValue })
					const startFundingBalance =
						await fundMe.provider.getBalance(fundMe.address)
					const startDeployerBalance =
						await fundMe.provider.getBalance(deployer)

					const response = await fundMe.cheaperWithdraw()
					const receipt = await response.wait(1)

					const { gasUsed, effectiveGasPrice } = receipt
					const gasCost = gasUsed.mul(effectiveGasPrice)

					const endFundingBalance = await fundMe.provider.getBalance(
						fundMe.address
					)
					const endDeployerBalance = await fundMe.provider.getBalance(
						deployer
					)

					assert.equal(endFundingBalance, 0)
					assert.equal(
						startFundingBalance
							.add(startDeployerBalance)
							.toString(),
						endDeployerBalance.add(gasCost).toString()
					)

					await expect(fundMe.funders(0)).to.be.reverted
					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.addressToAmountFunded(
								accounts[i].address
							),
							0
						)
					}
				})

				it('Only allows owner to withdraw', async function () {
					const accounts = await ethers.getSigners()
					const attacker = accounts[1]
					const attackerContract = await fundMe.connect(attacker)
					await expect(attackerContract.withdraw()).to.be.reverted
				})
			})
	  })
