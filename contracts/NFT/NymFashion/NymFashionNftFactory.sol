// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "../base/BaseNftFactory.sol";
import "./NymFashionNftUpgradeableProxy.sol";

contract NymFashionNftFactory is BaseNftFactory {

    constructor(address _nymLib, address _priceOracle,
        address _ownerAddress, address _proxyAdminAddress, address _impl,
        address _relayerAddress
    ) BaseNftFactory(_nymLib, _priceOracle, _ownerAddress, _proxyAdminAddress, _impl, _relayerAddress) public {
    }

    function newNftProxy(bytes memory data) internal override returns(address) {
        return address(new NymFashionNftUpgradeableProxy(impl, proxyAdminAddress, data));
    }
}