// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Weapon is ERC1155, Ownable {
    constructor() ERC1155("") {
        weaponName[1] = "Sword";
        weaponName[2] = "Bow";
        weaponName[3] = "Gun";
    }

    mapping(uint256 => string) weaponName;

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function setWeaponName(uint256 id, string calldata name) public onlyOwner {
        weaponName[id] = name;
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        require(bytes(weaponName[id]).length != 0, "This weapon doesn't exist");
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        for (uint i = 0; i < ids.length; i++) {
            require(
                bytes(weaponName[ids[i]]).length != 0,
                "This weapon doesn't exist"
            );
        }
        _mintBatch(to, ids, amounts, data);
    }
}
