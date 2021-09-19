// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

interface IPriceOracleUpgradeable {
    function zoneToken() external returns(address);
    function mintPriceInZone(uint256 _mintPrice) external returns (uint256);
}