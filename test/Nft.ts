import { expect } from "chai";
import { ethers } from "hardhat";
import { Player, Weapon } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { TransferEvent } from "../typechain-types/contracts/Player";

describe("Nft", function () {
  var weaponContract: Weapon;
  var playerContract: Player;
  var owner: SignerWithAddress, bob: SignerWithAddress, alice: SignerWithAddress;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  beforeEach(async function () {

    // Contracts are deployed using the first signer/account by default
    [owner, bob, alice] = await ethers.getSigners();

    const Weapon = await ethers.getContractFactory("Weapon");
    weaponContract = await Weapon.deploy();

    const Player = await ethers.getContractFactory("Player");
    playerContract = await Player.deploy(weaponContract.address);

  });

  describe("Equip weapon", function () {
    it("Mint and equip", async function () {
      let weaponId = 2;
      // mint a wepon
      await weaponContract.mint(bob.address, weaponId, 1, []);
      // mint a player
      let tx = await playerContract.safeMint(bob.address, "https://azk.imgix.net/images/903cd61d-61f7-4e7f-baba-5c45da46868f.png?dpr=1&w=1024");
      let result = await tx.wait();

      let eventTransfer = result.events?.find((x) => { return x.event == "Transfer" }) as TransferEvent;
      let playerId = eventTransfer.args.tokenId;

      // encode playerId to use safetransfer data
      const data = ethers.utils.defaultAbiCoder.encode(["uint256"], [playerId]);
      // safe transfer to player
      await weaponContract.connect(bob).safeTransferFrom(bob.address, playerContract.address, weaponId, 1, data);

      let getWeaponEquiped = await playerContract.weaponEquiped(playerId);
      expect(getWeaponEquiped).equal(weaponId);

      let getWeaponName = await weaponContract.weaponName(getWeaponEquiped);
      expect(getWeaponName).equal("Bow");
      console.log("weapon equiped", getWeaponName);
    });

    it("Transfer to another player", async function () {
      let weaponId = 2;
      // mint a wepon
      await weaponContract.mint(bob.address, weaponId, 1, []);
      // mint a player
      let tx = await playerContract.safeMint(bob.address, "https://azk.imgix.net/images/903cd61d-61f7-4e7f-baba-5c45da46868f.png?dpr=1&w=1024");
      let result = await tx.wait();

      let eventTransfer = result.events?.find((x) => { return x.event == "Transfer" }) as TransferEvent;
      let playerId = eventTransfer.args.tokenId;

      let owner = await playerContract.ownerOf(playerId);
      expect(owner).equal(bob.address);

      // encode playerId to use safetransfer data
      const data = ethers.utils.defaultAbiCoder.encode(["uint256"], [playerId]);
      // safe transfer to player
      await weaponContract.connect(bob).safeTransferFrom(bob.address, playerContract.address, weaponId, 1, data);

      // transfer player to alice
      await playerContract.connect(bob).transferFrom(bob.address, alice.address, playerId);

      let getWeaponEquiped = await playerContract.weaponEquiped(playerId);
      expect(getWeaponEquiped).equal(weaponId);

      let getWeaponName = await weaponContract.weaponName(getWeaponEquiped);
      expect(getWeaponName).equal("Bow");

      owner = await playerContract.ownerOf(playerId);
      expect(owner).equal(alice.address);
    });

    it("Equip manually and delink", async function () {
      let weaponId = 3;
      // mint a wepon
      await weaponContract.mint(bob.address, weaponId, 1, []);
      let weaponBalance = await weaponContract.balanceOf(bob.address, weaponId);
      expect(weaponBalance).equal(1);

      // mint a player
      let tx = await playerContract.safeMint(bob.address, "https://azk.imgix.net/images/903cd61d-61f7-4e7f-baba-5c45da46868f.png?dpr=1&w=1024");
      let result = await tx.wait();

      let eventTransfer = result.events?.find((x) => { return x.event == "Transfer" }) as TransferEvent;
      let playerId = eventTransfer.args.tokenId;

      // approve player contract
      await weaponContract.connect(bob).setApprovalForAll(playerContract.address, true);
      // equip
      await playerContract.connect(bob).equipWeapon(weaponId, 1);

      weaponBalance = await weaponContract.balanceOf(bob.address, weaponId);
      expect(weaponBalance).equal(0);

      let getWeaponEquiped = await playerContract.weaponEquiped(playerId);
      expect(getWeaponEquiped).equal(weaponId);

      let getWeaponName = await weaponContract.weaponName(getWeaponEquiped);
      expect(getWeaponName).equal("Gun");
      console.log("weapon equiped", getWeaponName);

      // unequip weapon
      await playerContract.connect(bob).unequipWeapon(playerId);

      weaponBalance = await weaponContract.balanceOf(bob.address, weaponId);
      expect(weaponBalance).equal(1);
    });

    it("Can't equip 2 weapons", async function () {
      let weaponId = 3;
      let secondWeapon = 1;
      // mint weapons
      await weaponContract.mint(bob.address, weaponId, 1, []);
      await weaponContract.mint(bob.address, secondWeapon, 1, []);

      // mint a player
      let tx = await playerContract.safeMint(bob.address, "https://azk.imgix.net/images/903cd61d-61f7-4e7f-baba-5c45da46868f.png?dpr=1&w=1024");
      let result = await tx.wait();

      let eventTransfer = result.events?.find((x) => { return x.event == "Transfer" }) as TransferEvent;
      let playerId = eventTransfer.args.tokenId;

      // approve player contract
      await weaponContract.connect(bob).setApprovalForAll(playerContract.address, true);
      // equip
      await playerContract.connect(bob).equipWeapon(weaponId, 1);

      let getWeaponEquiped = await playerContract.weaponEquiped(playerId);
      expect(getWeaponEquiped).equal(weaponId);

      let getWeaponName = await weaponContract.weaponName(getWeaponEquiped);
      expect(getWeaponName).equal("Gun");
      console.log("weapon equiped", getWeaponName);

      // we test the error
      let equipTx = playerContract.connect(bob).equipWeapon(secondWeapon, 1);
      await expect(equipTx).to.be.revertedWith("Already a weapon equiped");

    });
  });
});
