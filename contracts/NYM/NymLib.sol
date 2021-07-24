// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "../lib/encode/Base58.sol";

/**
 * @title NymLib
 * @dev This contract is needed to avoid code size exceeds 24576 bytes
 */
contract NymLib {

    function toBase58(bytes memory source) external pure returns (string memory)
    {
        return Base58.toBase58(source);
    }
}