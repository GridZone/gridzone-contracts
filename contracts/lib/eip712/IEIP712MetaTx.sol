// SPDX-License-Identifier:MIT
pragma solidity 0.7.6;

interface IEIP712MetaTx {
    function executeMetaTransaction(address _userAddress, bytes memory _functionSignature, bytes32 _sigR, bytes32 _sigS, uint8 _sigV) external payable returns(bytes memory);
}
