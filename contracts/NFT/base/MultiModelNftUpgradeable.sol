// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "./MultiModelNftUpgradeableBase.sol";
import "../../PriceOracle/IPriceOracleUpgradeable.sol";
import "../../NYM/INymLib.sol";

/**
 * @title MultiModelNftUpgradeable
 * @dev Extends ERC721 Non-Fungible Token Standard basic implementation
 */
contract MultiModelNftUpgradeable is MultiModelNftUpgradeableBase {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    function safeTransferOwnership(address newOwner, bool safely) public override {
        newOwner;
        safely;
        delegateAndReturn();
    }

    function safeAcceptOwnership() public override {
        delegateAndReturn();
    }

    /**
     * @notice Initializes the contract.
     * @param _nymLib Library contract for the token name
     * @param _priceOracle Library contract for the mint price
     * @param _ownerAddress Address of owner
     * @param _name Name of NFT
     * @param _symbol Symbol of NFT
     * @param _nameChangeable Option to changeable name
     * @param _colorChangeable Option to changeable color
     */
    function initialize(
        address _nymLib,
        address _priceOracle,
        address _ownerAddress,
        string memory _name,
        string memory _symbol,
        bool _nameChangeable,
        bool _colorChangeable,
        address _subImpl
    ) public initializer {
        require(_nymLib != address(0), "NYM library address is zero");
        require(_priceOracle != address(0), "Price oracle address is zero");
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
		__OpenseaERC721_init_unchained(_name, _symbol, address(0));
        __AccessControl_init();
        nymLib = INymLib(_nymLib);
        priceOracle = IPriceOracleUpgradeable(_priceOracle);
        nameChangeable = _nameChangeable;
        colorChangeable = _colorChangeable;

        subImpl = _subImpl;

        zoneToken = IERC20Upgradeable(priceOracle.zoneToken());
        require(address(zoneToken) != address(0), "ZONE token address is invalid");

        _setupRole(DEFAULT_ADMIN_ROLE, _ownerAddress);
    }

    /**
     * @dev Set the whitelists of OpenSea proxies.
     */
    function setOpenseaProxyRegistry(address _openseaProxyRegistryAddress) external onlyOwner() {
        proxyRegistryAddress = _openseaProxyRegistryAddress;
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
    ) external {
        _classes;
        _names;
        _metafileUris;
        _capacities;
        _mintPrices;
        _defaultColors;
        _bonuses;
        delegateAndReturn();
    }

    function setModelUri(uint256 _modelId, string memory _metafileUri) external {
        _modelId;
        _metafileUri;
        delegateAndReturn();
    }

    function setModelMintPrices(uint256[] memory _modelIds, uint256[] memory _mintPrices) external {
        _modelIds;
        _mintPrices;
        delegateAndReturn();
    }

    function setModelCapacities(uint256[] memory _modelIds, uint256[] memory _capacities) external {
        _modelIds;
        _capacities;
        delegateAndReturn();
    }

    function setModelAirdropCapacities(uint256[] memory _modelIds, uint256[] memory _capacities) external {
        _modelIds;
        _capacities;
        delegateAndReturn();
    }

    function getDefaultColor(uint256 _modelId) external view returns(bytes4[] memory) {
        return models[_modelId].defaultColor;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        uint256 modelId = modelIds[tokenId];
        return models[modelId].metafileUri;
    }

    /**
     * @dev Returns the price in ZONE for minting a token.
     */
    function mintPriceInZone(uint256 _modelId) public view returns (uint256) {
        return priceOracle.mintPriceInZone(models[_modelId].mintPrice);
    }

    /**
     * @dev Mints a token
     */
    function mint(uint256 _modelId) external {
        _mintToken(_modelId);
    }

    function mintWithParams(uint256 _modelId, string memory _newName, bytes4[] memory _newColor) external {
        _mintToken(_modelId);

        if (0 < bytes(_newName).length) {
            _changeName(_currentTokenId, _newName);
        }
        if (0 < _newColor.length) {
            _changeColor(_currentTokenId, _newColor);
        }
    }

    function _mintToken(uint256 _modelId) internal {
        require(_modelId < modelCount(), "Invalid model ID");
        Model storage model = models[_modelId];
        require(model.supply < model.capacity, "Exceeds capacity");
        model.supply ++;

        address sender = _msgSender();
        uint256 mintFee = mintPriceInZone(_modelId);
        if (0 < mintFee) {
            zoneToken.safeTransferFrom(sender, owner(), mintFee);
        }

        uint tokenId = ++ _currentTokenId;
        modelIds[tokenId] = _modelId;
        _safeMint(sender, tokenId);
        emit Mint(_modelId, sender, mintFee, tokenId);
    }

    /**
     * @dev Airdrop tokens to the specifeid addresses (Callable by owner).
     *      The supply is limited as 30 to avoid spending much gas and to avoid exceed block gas limit.
     */
    function doAirdrop(uint256 _modelId, address[] memory _accounts) external {
        _modelId;
        _accounts;
        delegateAndReturn();
    }

    function doAirdropBySignature(uint256 _modelId, address _account, uint256 _quantity, bytes memory _signature) external returns(uint256 leftCapacity) {
        require(_modelId < modelCount(), "MultiModelNft: Invalid model ID");
        require(_isValidSignature(_modelId, _account, _quantity, _signature), "MultiModelNft: Invalid signature");

        Model storage model = models[_modelId];
        require((model.airdropSupply + _quantity) <= model.airdropCapacity, "MultiModelNft: Exceeds capacity");
        model.airdropSupply += _quantity;

        for (uint i = 0; i < _quantity; i ++) {
            uint256 tokenId = ++ _currentTokenId;
            uint256 airdropNonce = airdropNonces[_account];
            modelIds[tokenId] = _modelId;
            airdropNonces[_account] ++;
            _safeMint(_account, tokenId);
            emit Airdrop(_modelId, _account, airdropNonce, tokenId);
        }
        leftCapacity = model.airdropCapacity.sub(model.airdropSupply);
    }

    function _isValidSignature(uint256 _modelId, address _account, uint256 _quantity, bytes memory _signature) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(address(this), _modelId, _account, _quantity, airdropNonces[_account]));
        bytes32 messageHash = ECDSAUpgradeable.toEthSignedMessageHash(message);

        // check that the signature is from admin signer.
        address recoveredAddress = ECDSAUpgradeable.recover(messageHash, _signature);
        return hasRole(ALLOWED_MINTERS, recoveredAddress);
    }

    /**
     * @dev Returns name of the NFT at tokenId.
     */
    function tokenNameById(uint256 tokenId) public view returns (string memory) {
        return _tokenName[tokenId];
    }

    /**
     * @dev Returns if the name has been reserved.
     */
    function isNameReserved(string memory nameString) public view returns (bool) {
        return _nameReserved[nymLib.toLower(nameString)];
    }

    /**
     * @dev Changes the name for tokenId
     */
    function changeName(uint256 tokenId, string memory newName) external {
        require(_msgSender() == ownerOf(tokenId), "Caller is not the token owner");
        require(sha256(bytes(newName)) != sha256(bytes(_tokenName[tokenId])), "New name is same as the current one");
        _changeName(tokenId, newName);
    }

    function _changeName(uint256 tokenId, string memory newName) internal {
        require(nameChangeable == true, "Disabled to change name");
        require(nymLib.validateName(newName) == true, "Invalid name");
        require(isNameReserved(newName) == false, "Name already reserved");

        if (bytes(_tokenName[tokenId]).length > 0) {
            toggleReserveName(_tokenName[tokenId], false);
        }
        toggleReserveName(newName, true);
        _tokenName[tokenId] = newName;
        emit NameChange(tokenId, _tokenName[tokenId]);
    }

    /**
     * @dev Reserves the name if isReserve is set to true, de-reserves if set to false
     */
    function toggleReserveName(string memory str, bool isReserve) internal {
        _nameReserved[nymLib.toLower(str)] = isReserve;
    }

    /**
     * @dev Returns colors array of the NFT at tokenId
     */
    function tokenColorById(uint256 tokenId) external view returns (bytes4[] memory) {
        if (0 < _colors[tokenId].length) {
            return _colors[tokenId];
        }

        uint256 modelId = modelIds[tokenId];
        return models[modelId].defaultColor;
    }

    /**
     * @dev Changes the color for tokenId
     */
    function changeColor(uint256 tokenId, bytes4[] memory color) external {
        require(_msgSender() == ownerOf(tokenId), "Caller is not the token owner");
        _changeColor(tokenId, color);
    }

    function _changeColor(uint256 tokenId, bytes4[] memory color) internal {
        require(colorChangeable == true, "Disabled to change color");

        uint256 modelId = modelIds[tokenId];
        require(0 == color.length || models[modelId].defaultColor.length == color.length, "Color length mismatch");

        _colors[tokenId] = color;
        emit ColorChange(tokenId, _colors[tokenId]);
    }

    /**
     * @dev Delegate to sub contract
     */
    function setSubImpl(address _subImpl) external onlyOwner() {
        require(_subImpl != address(0), "_subImpl is invaild");

        subImpl = _subImpl;
        emit NewSubImpl(subImpl);
    }

    function delegateAndReturn() private returns (bytes memory) {
        (bool success, ) = subImpl.delegatecall(msg.data);

        assembly {
            let free_mem_ptr := mload(0x40)
            returndatacopy(free_mem_ptr, 0, returndatasize())

            switch success
            case 0 { revert(free_mem_ptr, returndatasize()) }
            default { return(free_mem_ptr, returndatasize()) }
        }
    }
}
