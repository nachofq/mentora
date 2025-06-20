import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora', function () {
  async function deployMentora() {
    const [owner] = await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner };
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { mentora, owner } = await loadFixture(deployMentora);
      expect(await mentora.owner()).to.equal(owner.address);
    });
  });

  describe('Sessions', function () {});
});
