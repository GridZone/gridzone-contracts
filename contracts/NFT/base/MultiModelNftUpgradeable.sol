// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "../../lib/access/OwnableUpgradeable.sol";
import "../../lib/opensea/OpenseaERC721Upgradeable.sol";
import "../../PriceOracle/IPriceOracleUpgradeable.sol";
import "../../NYM/INymLib.sol";

/**
 * @title MultiModelNftUpgradeable
 * @dev Extends ERC721 Non-Fungible Token Standard basic implementation
 */
contract MultiModelNftUpgradeable is OwnableUpgradeable, OpenseaERC721Upgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    struct Model {
        // Bonus percent of the model
        uint8 bonus;
        // Class of the model
        uint8 class;
        // Name of the model
        string name;
        // URI of the model
        string metafileUri;
        // Capacity of the model
        uint256 capacity;
        // Count of token of the model
        uint256 supply;
        // Minting price in ETH
        uint256 mintPrice;
        // Default color of the model
        bytes4[] defaultColor;
    }

    INymLib public nymLib;
    IPriceOracleUpgradeable public priceOracle;

    uint256 private _currentTokenId = 0;

    /// @notice The address of the GridZone token
    IERC20Upgradeable public zoneToken;

    // Mapping from token ID to name
    mapping (uint256 => string) private _tokenName;
    // Mapping if certain name string has already been reserved
    mapping (string => bool) private _nameReserved;
    // Option to changeable name
    bool public nameChangeable;

    // Option to changeable color
    bool public colorChangeable;
    // Mapping if certain name string has already been reserved
    mapping (uint256 => bytes4[]) private _colors;

    // Array of models
    Model[] public models;
    // Mapping from token ID to model ID
    mapping (uint256 => uint256) public modelIds;

    // Admin address to do airdrop
    address private _admin;
    // The nonce for airdrop.
    mapping(address => uint256) public airdropNonces;

    // Events
    event AddModel (uint8 class, string name, string metafileUri, uint256 capacity, uint256 mintPrice, bytes4[] defaultColor, uint8 bonus);
    event ModelNewUri (uint256 indexed modelId, string newUri);
    event ModelNewMintPrice (uint256 indexed modelId, uint256 newMintPrice);
    event Mint (uint256 indexed modelId, address indexed account, uint256 mintFee, uint256 indexed tokenId, string newName, bytes4[] newColor);
    event Airdrop (uint256 indexed modelId, address indexed account, uint256 indexed tokenId);
    event NameChange (uint256 indexed tokenId, string newName);
    event ColorChange (uint256 indexed tokenId, bytes4[] newColor);

    modifier onlyAdmin() {
        require(_admin == _msgSender(), "Restricted access to admin");
        _;
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
        bool _colorChangeable
    ) public initializer {
        require(_nymLib != address(0), "NYM library address is zero");
        require(_priceOracle != address(0), "Price oracle address is zero");
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
		__OpenseaERC721_init_unchained(_name, _symbol, address(0));
        nymLib = INymLib(_nymLib);
        priceOracle = IPriceOracleUpgradeable(_priceOracle);
        nameChangeable = _nameChangeable;
        colorChangeable = _colorChangeable;

        _admin = _ownerAddress;

        zoneToken = IERC20Upgradeable(priceOracle.zoneToken());
        require(address(zoneToken) != address(0), "ZONE token address is invalid");
    }

    function _msgSender() internal override view returns (address payable) {
        return EIP712MetaTxUpgradeable.msgSender();
    }

    /**
     * @dev Return admin address for the airdrop
     */
    function admin() external view returns(address) {
        return _admin;
    }

    /**
     * @dev Update admin address
     */
    function setAdmin(address _adminAddress) external onlyOwner() {
        _admin = _adminAddress;
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
                defaultColor: _defaultColors[i]
            });
            models.push(model);
            emit AddModel (model.class, model.name, model.metafileUri, model.capacity, model.mintPrice, model.defaultColor, model.bonus);
        }
    }

    function modelCount() public view returns (uint256) {
        return models.length;
    }

    function getDefaultColor(uint256 _modelId) external view returns(bytes4[] memory) {
        return models[_modelId].defaultColor;
    }

    function setModelUri(uint256 _modelId, string memory _metafileUri) external onlyOwner() {
        require(_modelId < modelCount(), "Invalid model ID");
        models[_modelId].metafileUri = _metafileUri;
        emit ModelNewUri(_modelId, models[_modelId].metafileUri);
    }

    function setModelMintPrice(uint256 _modelId, uint256 _mintPrice) external onlyOwner() {
        require(_modelId < modelCount(), "Invalid model ID");
        models[_modelId].mintPrice = _mintPrice;
        emit ModelNewMintPrice(_modelId, models[_modelId].mintPrice);
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
    function mintPriceInZone(uint256 _modelId) public returns (uint256) {
        return priceOracle.mintPriceInZone(models[_modelId].mintPrice);
    }

    /**
     * @dev Mints a token
     */
    function mint(uint256 _modelId) external {
        bytes4[] memory emptyColor;
        _mintToken(_modelId, "", emptyColor);
    }

    function mintWithParams(uint256 _modelId, string memory _newName, bytes4[] memory _newColor) external {
        _mintToken(_modelId, _newName, _newColor);
    }

    function _mintToken(uint256 _modelId, string memory _newName, bytes4[] memory _newColor) internal {
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
        if (0 < bytes(_newName).length) {
            _changeName(tokenId, _newName);
        }
        if (0 < _newColor.length) {
            _changeColor(tokenId, _newColor);
        }

        _safeMint(sender, tokenId);
        modelIds[tokenId] = _modelId;
        emit Mint(_modelId, sender, mintFee, tokenId, _newName, _newColor);
    }

    /**
     * @dev Airdrop tokens to the specifeid addresses (Callable by owner).
     *      The supply is limited as 30 to avoid spending much gas and to avoid exceed block gas limit.
     */
    function doAirdrop(uint256 _modelId, address[] memory _accounts) external onlyAdmin() {
        require(_modelId < modelCount(), "Invalid model ID");
        require(0 < _accounts.length, "No account address");
        require(_accounts.length <= 30, "Exceeds limit");

        Model storage model = models[_modelId];
        require((model.supply + _accounts.length) <= model.capacity, "Exceeds capacity");
        model.supply += _accounts.length;

        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            uint tokenId = ++ _currentTokenId;
            _safeMint(account, tokenId);
            modelIds[tokenId] = _modelId;
            airdropNonces[account] ++;
            emit Airdrop(_modelId, account, tokenId);
        }
    }

    function doAirdropBySignature(uint256 _modelId, address _account, bytes memory _signature) external {
        require(_modelId < modelCount(), "Invalid model ID");
        require(_isValidSignature(_modelId, _account, _signature), "Invalid signature");

        Model storage model = models[_modelId];
        require(model.supply < model.capacity, "Exceeds capacity");
        model.supply ++;

        uint tokenId = ++ _currentTokenId;
        _safeMint(_account, tokenId);
        modelIds[tokenId] = _modelId;
        airdropNonces[_account] ++;
        emit Airdrop(_modelId, _account, tokenId);
    }

    function _isValidSignature(uint256 _modelId, address _account, bytes memory _signature) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(address(this), _modelId, _account, airdropNonces[_account]));
        bytes32 messageHash = ECDSAUpgradeable.toEthSignedMessageHash(message);

        // check that the signature is from admin signer.
        address recoveredAddress = ECDSAUpgradeable.recover(messageHash, _signature);
        return (recoveredAddress == _admin) ? true : false;
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

    uint256[38] private __gap;
}
