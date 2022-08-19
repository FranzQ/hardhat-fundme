//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import './PriceConverter.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/* @title Crowdfund contract
 * @author Franz Quarshie
 * @notice This contract allows users to deposit funds into the contract
 * @dev Contract deployer is the only one who can withdraw funds | Good Practices - Use 'constant' and 'immutable' to reduce gas
 */

error FUndMe__WithdrawFailed();

contract FundMe is Ownable {
	//Address of ETH price feed contract on Goerli Testnet - 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
	constructor(address priceFeedAddress) {
		priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	AggregatorV3Interface private priceFeed;
	using PriceConverter for uint256;
	//Set mimimun deposit amount  - 10 USD
	//Since solidity doesn't work with decimal plcaes, use base 18
	uint256 public constant MIN_USD = 0.1 * 1e18;
	address[] public funders;
	mapping(address => uint256) public addressToAmountFunded;

	/**
	 * @notice Function funds the contract
	 */
	function fund() public payable {
		//Require mimimun deposit amount
		//Function will revert with messsage if requirement fails -> Gas will be returned
		//msg.value will return 1e18
		require(
			msg.value.getConversionRate(priceFeed) >= MIN_USD,
			'Minimum Insufficient'
		); //1 x 10 x 18 = 100000000000000000 Wei
		funders.push(msg.sender);
		addressToAmountFunded[msg.sender] += msg.value;
	}

	function withdraw() public onlyOwner {
		for (
			uint256 funderIndex = 0;
			funderIndex < funders.length;
			funderIndex++
		) {
			address funder = funders[funderIndex];
			addressToAmountFunded[funder] = 0;
		}
		funders = new address[](0);
		//Transfer - Caps at 2300 gas, Throws error
		//payable(msg.sender).transfer(address(this).balance);

		//Send - Caps at 2300 gas, Returns boolean
		//bool sent = payable(msg.sender).send(address(this).balance);
		//require(sent, "Withdrawal failed");

		//Call - Forawards all gas or set gas, Returns boolean
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}('');
		if (callSuccess == false) {
			revert FUndMe__WithdrawFailed();
		}
	}

	function cheaperWithdraw() public onlyOwner {
		address[] memory copyFunders = funders;
		for (
			uint256 funderIndex = 0;
			funderIndex < funders.length;
			funderIndex++
		) {
			address funder = copyFunders[funderIndex];
			addressToAmountFunded[funder] = 0;
		}
		funders = new address[](0);

		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}('');
		if (callSuccess == false) {
			revert FUndMe__WithdrawFailed();
		}
	}

	function getPriceFeed() public view returns (AggregatorV3Interface) {
		return priceFeed;
	}

	//If msg.data is null
	//This special function is triggered if a transaction is sent without data i.e the dedicated function to receive and process deposits
	receive() external payable {
		//Send donation to contract creator
		payable(owner()).transfer(msg.value);
	}

	//This special function is triggered if no msg.data is empty
	fallback() external payable {
		//Send donation to contract creator
		payable(owner()).transfer(msg.value);
	}
}
