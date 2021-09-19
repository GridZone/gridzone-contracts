// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

import "../lib/access/OwnableUpgradeable.sol";
import './UniswapV2OracleLibrary.sol';

/**
 * @title PriceOracleUpgradeable
 * @dev Price oracle to calculate the mint price in ZONE. This contract is needed to avoid code size exceeds 24576 bytes
 */
contract PriceOracleUpgradeable is OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;
    using FixedPoint for *;

    // The address of the GridZone token
    address public zoneToken;

    // Flag to specify whether ZONE/ETH pool enabled
    bool public usePoolPrice;

    // LP token for ZONE/ETH
    IUniswapV2Pair public lpZoneEth;
    // ZONE reserve in ZONE/ETH
    uint256 public zoneReserveInLP;
    // ETH reserve in ZONE/ETH
    uint256 public ethReserveInLP;

    uint256 public constant PERIOD = 24 hours;
    uint32  public blockTimestampLast;

    // The last cumulative price of ETH in ZONE
    uint256 public priceCumulativeLast;
    // The average price of ETH in ZONE
    FixedPoint.uq112x112 public priceAverage;

    // Events
    event ActivatePoolPrice (bool newUsePoolPrice, uint256 newZoneReserveInLP, uint256 newEthReserveInLP);
    event NewZoneEthLP (address indexed newZoneEthLP);

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _zoneTokenAddress ZONE token address
     * @param _lpZoneEth Sushi swap LP address
     * @param _usePoolPrice Flag to specify whether ZONE/ETH pool enabled
     * @param _zoneReserveAmount ZONE reserve in ZONE/ETH
     * @param _ethReserveAmount ETH reserve in ZONE/ETH
     */
    function initialize(
        address _ownerAddress,
        address _zoneTokenAddress,
        address _lpZoneEth,
        bool _usePoolPrice,
        uint256 _zoneReserveAmount,
        uint256 _ethReserveAmount
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(_zoneTokenAddress != address(0), "ZONE token address is invalid");

        __Ownable_init(_ownerAddress);
        zoneToken = _zoneTokenAddress;
        _setZoneEthLP(_lpZoneEth);
        _activatePoolPrice(_usePoolPrice, _zoneReserveAmount, _ethReserveAmount);
    }

    /**
     * @dev Activate the price calculation by using ZONE/ETH SLP.
     */
    function activatePoolPrice(bool _usePoolPrice, uint256 _zoneReserveAmount, uint256 _ethReserveAmount) onlyOwner external {
        _activatePoolPrice(_usePoolPrice, _zoneReserveAmount, _ethReserveAmount);
        emit ActivatePoolPrice(usePoolPrice, zoneReserveInLP, ethReserveInLP);
    }

    function _activatePoolPrice(bool _usePoolPrice, uint256 _zoneReserveAmount, uint256 _ethReserveAmount) internal {
        if (_usePoolPrice) {
            require(address(lpZoneEth) != address(0), "Sushiswap LP token address must be valid to use the pool price");
            usePoolPrice = true;
        } else {
            require(0 < _zoneReserveAmount, "The ZONE reserve amount can not be 0");
            require(0 < _ethReserveAmount, "The ETH reserve amount can not be 0");
            usePoolPrice = false;
            zoneReserveInLP = _zoneReserveAmount;
            ethReserveInLP = _ethReserveAmount;
        }
    }

    /**
     * @dev Set the ZONE/ETH LP address.
     */
    function setZoneEthLP(address _lpZoneEth) onlyOwner external {
        _setZoneEthLP(_lpZoneEth);
        emit NewZoneEthLP(address(lpZoneEth));
    }

    function _setZoneEthLP(address _lpZoneEth) internal {
        lpZoneEth = IUniswapV2Pair(_lpZoneEth);
        if (address(lpZoneEth) != address(0)) {
            (uint112 reserve0, uint112 reserve1, uint32 blockTimestamp) = lpZoneEth.getReserves();
            require(reserve0 != 0 && reserve1 != 0, 'No reserves on the liquidity pool');

            // fetch the current accumulated price value (1 / 0)
            priceCumulativeLast = (lpZoneEth.token1() == zoneToken) ? lpZoneEth.price0CumulativeLast() : lpZoneEth.price1CumulativeLast();
            blockTimestampLast = blockTimestamp;
            priceAverage._x = 0;
        }
    }

    function _update() internal {
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) = UniswapV2OracleLibrary.currentCumulativePrices(address(lpZoneEth));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update, or it's first calculation
        if ((PERIOD <= timeElapsed) || (priceAverage._x == 0 && 0 < timeElapsed)) {
            uint256 priceCumulative = (lpZoneEth.token1() == zoneToken) ? price0Cumulative : price1Cumulative;
            // overflow is desired, casting never truncates
            // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            priceAverage = FixedPoint.uq112x112(uint224((priceCumulative - priceCumulativeLast) / timeElapsed));

            priceCumulativeLast = priceCumulative;
            blockTimestampLast = blockTimestamp;
        }
    }

    /**
     * @dev Take the price in ZONE for minting a token, and return it.
     */
    function mintPriceInZone(uint256 _mintPriceInEth) external returns (uint256) {
        if (_mintPriceInEth == 0) return 0;

        if (usePoolPrice && address(lpZoneEth) != address(0)) {
            _update();
            return priceAverage.mul(_mintPriceInEth).decode144();
        } else {
            if (zoneReserveInLP == 0 || ethReserveInLP == 0) return 0;
            return _mintPriceInEth.mul(zoneReserveInLP).div(ethReserveInLP);
        }
    }

    uint256[42] private __gap;
}
