import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Deployment', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { mentora, owner } = await loadFixture(deployMentora);
      expect(await mentora.owner()).to.equal(owner.address);
    });

    it('Should initialize with zero lobbies', async function () {
      const { mentora } = await loadFixture(deployMentora);
      expect(await mentora.getTotalLobbies()).to.equal(0);
    });

    it('Should deploy with correct initial state', async function () {
      const { mentora } = await loadFixture(deployMentora);

      // Check that the contract is deployed and has code
      const code = await hre.ethers.provider.getCode(mentora.target);
      expect(code).to.not.equal('0x');

      // Check that the contract address is valid
      expect(mentora.target).to.not.equal(hre.ethers.ZeroAddress);
    });
  });
});
