// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../../lib/access/OwnableUpgradeable.sol";
import "./IPriceOracleUpgradeable.sol";

interface ISLPToken is IERC20Upgradeable {
    function getReserves() external view returns (uint112, uint112, uint32);
    function token0() external view returns (address);
}

/**
 * @title PriceOracleUpgradeable
 * @dev Price oracle to calculate the mint price in ZONE. This contract is needed to avoid code size exceeds 24576 bytes
 */
contract PriceOracleUpgradeable is IPriceOracleUpgradeable, OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;

    // The address of the GridZone token
    address private _zoneToken;

    // SLP token for ZONE/ETH
    ISLPToken public slpZoneEth;
    // ZONE reserve in ZONE/ETH
    uint256 public zoneReserveInSLP;
    // ETH reserve in ZONE/ETH
    uint256 public ethReserveInSLP;
    // The weight for the new reserves in price calculation
    uint256 public reserveWeight;
    uint256 public constant WEIGHT_DENOMINATOR = 10000;

    // Flag to specify whether ZONE/ETH pool enabled
    bool public usePoolPrice;

    // Events
    event ActivatePoolPrice (bool newUsePoolPrice, uint256 newZoneReserveInSLP, uint256 newEthReserveInSLP);
    event NewZoneEthSLP (address indexed newZoneEthSLP);
    event NewSLPReserveWeight (uint256 indexed newWeight);

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _zoneTokenAddress ZONE token address
     * @param _slpZoneEth Sushi swap LP address
     * @param _reserveWeight The weight of current reserves in calculation
     * @param _usePoolPrice Flag to specify whether ZONE/ETH pool enabled
     * @param _zoneReserveAmount ZONE reserve in ZONE/ETH
     * @param _ethReserveAmount ETH reserve in ZONE/ETH
     */
    function initialize(
        address _ownerAddress,
        address _zoneTokenAddress,
        address _slpZoneEth,
        uint256 _reserveWeight,
        bool _usePoolPrice,
        uint256 _zoneReserveAmount,
        uint256 _ethReserveAmount
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(_zoneTokenAddress != address(0), "ZONE token address is invalid");
        require(_reserveWeight <= WEIGHT_DENOMINATOR, "The weight should be less than 10000");

        __Ownable_init(_ownerAddress);
        _zoneToken = _zoneTokenAddress;
        slpZoneEth = ISLPToken(_slpZoneEth);
        reserveWeight = _reserveWeight;
        _activatePoolPrice(_usePoolPrice, _zoneReserveAmount, _ethReserveAmount);
    }

    function zoneToken() external view override returns(address) {
        return _zoneToken;
    }

    /**
     * @dev Activate the price calculation by using ZONE/ETH SLP.
     */
    function activatePoolPrice(bool _usePoolPrice, uint256 _zoneReserveAmount, uint256 _ethReserveAmount) onlyOwner external {
        _activatePoolPrice(_usePoolPrice, _zoneReserveAmount, _ethReserveAmount);
        emit ActivatePoolPrice(usePoolPrice, zoneReserveInSLP, ethReserveInSLP);
    }

    function _activatePoolPrice(bool _usePoolPrice, uint256 _zoneReserveAmount, uint256 _ethReserveAmount) internal {
        if (_usePoolPrice) {
            require(address(slpZoneEth) != address(0), "Sushiswap LP token address must be valid to use the pool price");
            usePoolPrice = true;
            zoneReserveInSLP = 0;
            ethReserveInSLP = 0;
        } else {
            require(0 < _zoneReserveAmount, "The ZONE reserve amount can not be 0");
            require(0 < _ethReserveAmount, "The ETH reserve amount can not be 0");
            usePoolPrice = false;
            zoneReserveInSLP = _zoneReserveAmount;
            ethReserveInSLP = _ethReserveAmount;
        }
    }

    /**
     * @dev Set the ZONE/ETH SLP address.
     */
    function setZoneEthSLP(address _slpZoneEth) onlyOwner external {
        require(_slpZoneEth != address(0), "Sushiswap LP token address is invalid");
        slpZoneEth = ISLPToken(_slpZoneEth);
        zoneReserveInSLP = 0;
        ethReserveInSLP = 0;
        emit NewZoneEthSLP(address(slpZoneEth));
    }

    /**
     * @dev Set the weight for the current reserves in price calculation.
     */
    function setSLPReserveWeight(uint256 _reserveWeight) onlyOwner external {
        require(_reserveWeight <= WEIGHT_DENOMINATOR, "The weight should be less than 10000");
        reserveWeight = _reserveWeight;
        emit NewSLPReserveWeight(reserveWeight);
    }

    /**
     * @dev Take the price in ZONE for minting a token, and return it.
     */
    function mintPriceInZone(uint256 _mintPriceInEth) external override returns (uint256) {
        if (_mintPriceInEth == 0) return 0;

        if (usePoolPrice && address(slpZoneEth) != address(0)) {
            uint256 zoneReserve;
            uint256 ethReserve;
            (uint112 _reserve0, uint112 _reserve1,) = slpZoneEth.getReserves();
            if (slpZoneEth.token0() == address(_zoneToken)) {
                zoneReserve = uint256(_reserve0);
                ethReserve = uint256(_reserve1);
            } else {
                zoneReserve = uint256(_reserve1);
                ethReserve = uint256(_reserve0);
            }

            if (zoneReserveInSLP == 0 || ethReserveInSLP == 0) {
                zoneReserveInSLP = zoneReserve;
                ethReserveInSLP = ethReserve;
            } else if (zoneReserve == 0 || ethReserve == 0) {
            } else {
                zoneReserveInSLP = zoneReserveInSLP.mul(WEIGHT_DENOMINATOR.sub(reserveWeight))
                    .add(zoneReserve.mul(reserveWeight))
                    .div(WEIGHT_DENOMINATOR);
                ethReserveInSLP = ethReserveInSLP.mul(WEIGHT_DENOMINATOR.sub(reserveWeight))
                    .add(ethReserve.mul(reserveWeight))
                    .div(WEIGHT_DENOMINATOR);
            }
        }

        if (zoneReserveInSLP == 0 || ethReserveInSLP == 0) return 0;
        return _mintPriceInEth.mul(zoneReserveInSLP).div(ethReserveInSLP);
    }

    /**
     * @dev Returns the price in ZONE for minting a token.
     */
    function getMintPriceInZone(uint256 _mintPriceInEth) external view returns (uint256) {
        if (_mintPriceInEth == 0) return 0;

        uint256 zoneReserve;
        uint256 ethReserve;
        if (usePoolPrice && address(slpZoneEth) != address(0)) {
            (uint112 _reserve0, uint112 _reserve1,) = slpZoneEth.getReserves();
            if (slpZoneEth.token0() == address(_zoneToken)) {
                zoneReserve = uint256(_reserve0);
                ethReserve = uint256(_reserve1);
            } else {
                zoneReserve = uint256(_reserve1);
                ethReserve = uint256(_reserve0);
            }

            if (zoneReserveInSLP == 0 || ethReserveInSLP == 0) {
            } else if (zoneReserve == 0 || ethReserve == 0) {
                zoneReserve = zoneReserveInSLP;
                ethReserve = ethReserveInSLP;
            } else {
                zoneReserve = zoneReserveInSLP.mul(WEIGHT_DENOMINATOR.sub(reserveWeight))
                    .add(zoneReserve.mul(reserveWeight))
                    .div(WEIGHT_DENOMINATOR);
                ethReserve = ethReserveInSLP.mul(WEIGHT_DENOMINATOR.sub(reserveWeight))
                    .add(ethReserve.mul(reserveWeight))
                    .div(WEIGHT_DENOMINATOR);
            }
        } else {
            zoneReserve = zoneReserveInSLP;
            ethReserve = ethReserveInSLP;
        }

        if (zoneReserve == 0 || ethReserve == 0) return 0;
        return _mintPriceInEth.mul(zoneReserve).div(ethReserve);
    }

    uint256[44] private __gap;
}
