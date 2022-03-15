// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../lib/access/OwnableUpgradeable.sol";
import "../lib/price/IChainlinkAggregator.sol";

contract GameCreditSaleUpgradeable is OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;

    IChainlinkAggregator public constant priceFeed = IChainlinkAggregator(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
    uint8 public constant priceDecimals = 8;

    event Sold (address indexed buyer, uint256 indexed ethAmount, uint256 indexed credits);

    function initialize(
        address _ownerAddress
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");
        __Ownable_init(_ownerAddress);
    }

    /**
     * @notice Return the price of ETH in USD.
     */
    function ethPrice() public view returns (int256, uint8) {
        return (priceFeed.latestAnswer(), priceDecimals);
    }

    function withdraw() external onlyOwner() {
        require(owner() != address(0), "Withdraw to the zero address");

        uint256 balance = address(this).balance;
        if (0 < balance) {
            address payable ownerAddress = address(uint160(owner()));
            AddressUpgradeable.sendValue(ownerAddress, balance);
        }
    }

    function purchase() external payable {
        uint256 credits = msg.value.mul(uint256(priceFeed.latestAnswer())).div(10 ** (priceDecimals+17));
        credits = credits.add(1).div(10); // Round up. If 0.9, then it will be 1.
        emit Sold(_msgSender(), msg.value, credits);
    }

    receive() external payable {
        require(false, "Use the purchase function to buy the ZONE token.");
    }
}

contract GameCreditSaleUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {
    }
}