import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Lock", function () {
  
  async function deploySessions() {
    // Contracts are deployed using the first signer/account by default
    const [
      owner, 
      mentor, 
      creator, 
      participantOne, 
      ParticipantTwo
    ] = await hre.ethers.getSigners();

    const Mentors = await hre.ethers.getContractFactory("Mentors");
    const mentors = await Mentors.deploy();
    
    const Token = await hre.ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("USDC", "USDC", 18, 1000);

    // MentorsContract _mentors, IERC20 _token, uint8 _fee
    const Sessions = await hre.ethers.getContractFactory("Sessions");
    const sessions = await Sessions.deploy(mentors.target, token.target, 500);

    return { sessions, owner, mentor, creator, participantOne, ParticipantTwo};
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { sessions, owner } = await loadFixture(deploySessions);

      expect(await sessions.owner()).to.equal(owner.address);
    });
  });
});
