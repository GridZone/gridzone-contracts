// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "../../lib/access/Ownable.sol";
import "./IRideUpgradeable.sol";
import "./RideUpgradeableProxy.sol";
import "../../BiconomyRelay/IBiconomyMetaTxRelay.sol";

contract RideUpgradeableFactory is Ownable {
    address public proxyAdminAddress;
    address public rideTemplate;
    address public zoneToken;
    address public slpZoneEth;

    IBiconomyMetaTxRelay public relayerAddress;
    RideUpgradeableProxy[] public rides;

    event NewRide (address indexed ride,
        string name, string _symbol, string _rideUri, uint256 _capacity,
        uint256 _price, bool _nameChangeable, bool _colorChangeable, bytes4[] _color);

    constructor(address _ownerAddress, address _proxyAdminAddress, address _rideTemplate,
        address _zoneToken, address _slpZoneEth, address _relayerAddress
    ) Ownable(_ownerAddress) public {
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(_proxyAdminAddress != address(0), "Proxy admin address is invalid");
        require(_rideTemplate != address(0), "Ride template address is invalid");
        require(_zoneToken != address(0), "ZONE token address is invalid");
        require(_slpZoneEth != address(0), "Sushiswap LP token address is invalid");
        require(_relayerAddress != address(0), "MetaTransaction relayer is invalid");

        proxyAdminAddress = _proxyAdminAddress;
        rideTemplate = _rideTemplate;
        zoneToken = _zoneToken;
        slpZoneEth = _slpZoneEth;

        relayerAddress = IBiconomyMetaTxRelay(_relayerAddress);
    }

    /**
     * @notice Create new ride.
     * @param _name Name of ride ride
     * @param _symbol Symbol of the ride
     * @param _rideUri URI of information file for the ride
     * @param _capacity Capacity of token, If this value is 0, no limited.
     * @param _price Minting price in ETH
     * @param _nameChangeable Option to changeable name
     * @param _colorChangeable Option to changeable color
     * @param _color Default color
     */
    function createRide(
        string memory _name,
        string memory _symbol,
        string memory _rideUri,
        uint256 _capacity,
        uint256 _price,
        bool _nameChangeable,
        bool _colorChangeable,
        bytes4[] memory _color
    ) external onlyOwner() {
        require(0 < bytes(_name).length, "Factory: name is empty");
        require(0 < bytes(_symbol).length, "Factory: symbol is empty");

        bytes memory data = abi.encodeWithSelector(IRideUpgradeable(0).initialize.selector,
            owner(),
            _name,
            _symbol,
            _rideUri,
            _capacity,
            _price,
            zoneToken,
            slpZoneEth,
            _nameChangeable,
            _colorChangeable,
            _color
        );

        RideUpgradeableProxy ride = new RideUpgradeableProxy(rideTemplate, proxyAdminAddress, data);
        relayerAddress.allowRelay(address(ride));
        rides.push(ride);
        emit NewRide(address(ride), _name, _symbol, _rideUri, _capacity, _price, _nameChangeable, _colorChangeable, _color);
    }

}