// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

abstract contract IBaseNftUpgradeable {

    function initialize(
        address _nymLib,
        address _priceOracle,
        address _ownerAddress,
        string memory _name,
        string memory _symbol,
        string memory _metafileUri,
        uint256 _capacity,
        uint256 _price,
        bool _nameChangeable,
        bool _colorChangeable,
        bytes4[] memory _color
    ) public virtual;

}