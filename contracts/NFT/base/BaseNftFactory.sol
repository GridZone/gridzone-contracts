// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

import "../../lib/access/Ownable.sol";
import "../base/IBaseNftUpgradeable.sol";
import "../../BiconomyRelay/IBiconomyMetaTxRelay.sol";

contract BaseNftFactory is Ownable {
    address public nymLib;
    address public priceOracle;
    address public proxyAdminAddress;
    address public impl;

    IBiconomyMetaTxRelay public relayerAddress;
    address[] public nfts;

    event NewNFT (address indexed nft,
        string name, string symbol, string metafileUri, uint256 capacity,
        uint256 price, bool nameChangeable, bool colorChangeable, bytes4[] color);

    constructor(address _nymLib, address _priceOracle,
        address _ownerAddress, address _proxyAdminAddress, address _impl,
        address _relayerAddress
    ) Ownable(_ownerAddress) public {
        require(_nymLib != address(0), "NYM library address is zero");
        require(_priceOracle != address(0), "Price oracle address is zero");
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(_proxyAdminAddress != address(0), "Proxy admin address is invalid");
        require(_impl != address(0), "NFT implementation template address is invalid");
        require(_relayerAddress != address(0), "MetaTransaction relayer is invalid");

        nymLib = _nymLib;
        priceOracle = _priceOracle;
        proxyAdminAddress = _proxyAdminAddress;
        impl = _impl;

        relayerAddress = IBiconomyMetaTxRelay(_relayerAddress);
    }

    /**
     * @notice Create new NFT.
     * @param _name Name of NFT
     * @param _symbol Symbol of NFT
     * @param _metafileUri URI of information file for the NFT
     * @param _capacity Capacity of token, If this value is 0, no limited.
     * @param _price Minting price in ETH
     * @param _nameChangeable Option to changeable name
     * @param _colorChangeable Option to changeable color
     * @param _color Default color
     */
    function createNFT(
        string memory _name,
        string memory _symbol,
        string memory _metafileUri,
        uint256 _capacity,
        uint256 _price,
        bool _nameChangeable,
        bool _colorChangeable,
        bytes4[] memory _color
    ) external onlyOwner() {
        require(0 < bytes(_name).length, "Factory: name is empty");
        require(0 < bytes(_symbol).length, "Factory: symbol is empty");

        bytes memory data = abi.encodeWithSelector(IBaseNftUpgradeable(0).initialize.selector,
            nymLib,
            priceOracle,
            owner(),
            _name,
            _symbol,
            _metafileUri,
            _capacity,
            _price,
            _nameChangeable,
            _colorChangeable,
            _color
        );

        address nft = newNftProxy(data);
        relayerAddress.allowRelay(nft);
        nfts.push(nft);
        emit NewNFT(nft, _name, _symbol, _metafileUri, _capacity, _price, _nameChangeable, _colorChangeable, _color);
    }

    function newNftProxy(bytes memory data) internal virtual returns(address) {
        return address(new TransparentUpgradeableProxy(impl, proxyAdminAddress, data));
    }
}