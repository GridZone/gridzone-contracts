// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "./MultiModelNftUpgradeableBase.sol";
import "../../lib/access/OwnableUpgradeable.sol";
import "../../lib/opensea/OpenseaERC721Upgradeable.sol";

contract MultiModelNftUpgradeableSub is MultiModelNftUpgradeableBase {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    function safeTransferOwnership(address newOwner, bool safely) public override onlyOwner() {
        address _oldOwner = owner();
        super.safeTransferOwnership(newOwner, safely);
        if (!safely) {
            _setupRole(DEFAULT_ADMIN_ROLE, newOwner);
            revokeRole(DEFAULT_ADMIN_ROLE, _oldOwner);
        }
    }

    function safeAcceptOwnership() public override {
        address _oldOwner = owner();
        address _pendingOwner = pendingOwner();
        super.safeAcceptOwnership();

        _setupRole(DEFAULT_ADMIN_ROLE, _pendingOwner);
        revokeRole(DEFAULT_ADMIN_ROLE, _oldOwner);
    }

    /**
     * @notice Add a new model.
     * @param _classes Class of the model
     * @param _names Name of the model
     * @param _metafileUris URI of the model
     * @param _capacities Capacity of the model
     * @param _mintPrices Minting price in ETH
     * @param _defaultColors Default color of the model
     * @param _bonuses Bonus of the model
     */
    function addModels(
        uint8[] memory _classes,
        string[] memory _names,
        string[] memory _metafileUris,
        uint256[] memory _capacities,
        uint256[] memory _mintPrices,
        bytes4[][] memory _defaultColors,
        uint8[] memory _bonuses
    ) external onlyOwner() {
        require(
            _classes.length == _names.length
            && _classes.length == _metafileUris.length
            && _classes.length == _capacities.length
            && _classes.length == _mintPrices.length
            && _classes.length == _defaultColors.length
            && _classes.length == _bonuses.length,
            "Mismatched data"
        );

        for (uint256 i = 0; i < _bonuses.length; i ++) {
            Model memory model = Model({
                bonus: _bonuses[i],
                class: _classes[i],
                name: _names[i],
                metafileUri: _metafileUris[i],
                capacity: _capacities[i],
                supply: 0,
                mintPrice: _mintPrices[i],
                defaultColor: _defaultColors[i],
                airdropCapacity: _capacities[i],
                airdropSupply: 0
            });
            models.push(model);
            emit AddModel (model.class, model.name, model.metafileUri, model.capacity, model.mintPrice, model.defaultColor, model.bonus);
        }
    }

    function setModelUri(uint256 _modelId, string memory _metafileUri) external onlyOwner() {
        require(_modelId < modelCount(), "Invalid model ID");
        models[_modelId].metafileUri = _metafileUri;
        emit ModelNewUri(_modelId, models[_modelId].metafileUri);
    }

    function setModelMintPrices(uint256[] memory _modelIds, uint256[] memory _mintPrices) external onlyOwner() {
        require(_modelIds.length == _mintPrices.length, "Mismatched data");

        for (uint256 i = 0; i < _modelIds.length; i ++) {
            uint256 _modelId = _modelIds[i];
            uint256 _mintPrice = _mintPrices[i];
            require(_modelId < modelCount(), "Invalid model ID");

            models[_modelId].mintPrice = _mintPrice;
            emit ModelNewMintPrice(_modelId, models[_modelId].mintPrice);
        }
    }

    function setModelCapacities(uint256[] memory _modelIds, uint256[] memory _capacities) external onlyOwner() {
        require(_modelIds.length == _capacities.length, "Mismatched data");

        for (uint256 i = 0; i < _modelIds.length; i ++) {
            uint256 _modelId = _modelIds[i];
            uint256 _capacity = _capacities[i];
            require(_modelId < modelCount(), "Invalid model ID");
            require(models[_modelId].supply <= _capacity, "New capacity should be equal or greater than the current supply");

            models[_modelId].capacity = _capacity;
            emit ModelNewCapacity(_modelId, models[_modelId].capacity);
        }
    }

    function setModelAirdropCapacities(uint256[] memory _modelIds, uint256[] memory _capacities) external onlyOwner() {
        require(_modelIds.length == _capacities.length, "Mismatched data");

        for (uint256 i = 0; i < _modelIds.length; i ++) {
            uint256 _modelId = _modelIds[i];
            uint256 _capacity = _capacities[i];
            require(_modelId < modelCount(), "Invalid model ID");
            require(models[_modelId].airdropSupply <= _capacity, "New capacity should be equal or greater than the current supply");

            models[_modelId].airdropCapacity = _capacity;
            emit ModelNewAirdropCapacity(_modelId, models[_modelId].airdropCapacity);
        }
    }

    /**
     * @dev Airdrop tokens to the specifeid addresses (Callable by owner).
     *      The supply is limited as 30 to avoid spending much gas and to avoid exceed block gas limit.
     */
    function doAirdrop(uint256 _modelId, address[] memory _accounts) external returns(uint256 leftCapacity) {
        require(hasRole(ALLOWED_MINTERS, _msgSender()), "MultiModelNft: Restricted access to minters");
        require(_modelId < modelCount(), "MultiModelNft: Invalid model ID");
        require(0 < _accounts.length, "MultiModelNft: No account address");
        require(_accounts.length <= 30, "MultiModelNft: Exceeds limit");

        Model storage model = models[_modelId];
        require((model.airdropSupply + _accounts.length) <= model.airdropCapacity, "MultiModelNft: Exceeds capacity");
        model.airdropSupply += _accounts.length;

        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            uint256 tokenId = ++ _currentTokenId;
            modelIds[tokenId] = _modelId;
            _safeMint(account, tokenId);
            emit Airdrop(_modelId, account, type(uint256).max, tokenId);
        }
        leftCapacity = model.airdropCapacity.sub(model.airdropSupply);
    }
}
