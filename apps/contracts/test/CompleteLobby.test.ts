import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Complete Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();

    return { mentora, owner, creator, master, participant1, participant2 };
  }

  describe('Complete Lobby', function () {
    const lobbyParams = {
      maxParticipants: 3,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for completion',
    };

    async function createAcceptedLobbyWithParticipants() {
      const { mentora, creator, master, participant1, participant2 } =
        await loadFixture(deployMentora);

      // Create lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Add participants
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Accept lobby
      await mentora.connect(master).acceptLobby(1);

      return { mentora, creator, master, participant1, participant2 };
    }

    async function createAcceptedEmptyLobby() {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Accept empty lobby
      await mentora.connect(master).acceptLobby(1);

      return { mentora, creator, master };
    }

    async function createCreatedLobbyWithParticipants() {
      const { mentora, creator, master, participant1, participant2 } =
        await loadFixture(deployMentora);

      // Create lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Add participants but don't accept
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      return { mentora, creator, master, participant1, participant2 };
    }

    it('Should allow master to complete lobby successfully', async function () {
      const { mentora, master } = await createAcceptedLobbyWithParticipants();

      const masterBalanceBefore = await hre.ethers.provider.getBalance(
        master.address
      );

      const tx = await mentora.connect(master).completeLobby(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const masterBalanceAfter = await hre.ethers.provider.getBalance(
        master.address
      );

      // Check that lobby state changed to Completed
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(3); // LobbyState.Completed
      expect(lobbyInfo.totalDeposited).to.equal(0); // Should be reset to 0

      // Check that master received the payment
      const expectedPayment = lobbyParams.amountPerParticipant * 2n;
      expect(masterBalanceAfter).to.equal(
        masterBalanceBefore + expectedPayment - BigInt(gasUsed)
      );
    });

    it('Should emit LobbyCompleted event', async function () {
      const { mentora, master } = await createAcceptedLobbyWithParticipants();

      const expectedPayment = lobbyParams.amountPerParticipant * 2n;

      await expect(mentora.connect(master).completeLobby(1))
        .to.emit(mentora, 'LobbyCompleted')
        .withArgs(
          1, // lobbyId
          master.address,
          expectedPayment // totalPaid
        );
    });

    it('Should clear all participant deposits after completion', async function () {
      const { mentora, master, participant1, participant2 } =
        await createAcceptedLobbyWithParticipants();

      // Check deposits before completion
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(lobbyParams.amountPerParticipant);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(lobbyParams.amountPerParticipant);

      // Complete lobby
      await mentora.connect(master).completeLobby(1);

      // Check deposits after completion - should be 0
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(0);
    });

    it('Should handle completion of lobby at full capacity', async function () {
      const { mentora, master, participant1, participant2 } = await loadFixture(
        deployMentora
      );
      const signers = await hre.ethers.getSigners();

      // Create lobby
      await mentora
        .connect(signers[0])
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Fill to capacity
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(signers[5]).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Accept and complete lobby
      await mentora.connect(master).acceptLobby(1);

      const masterBalanceBefore = await hre.ethers.provider.getBalance(
        master.address
      );

      const tx = await mentora.connect(master).completeLobby(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const masterBalanceAfter = await hre.ethers.provider.getBalance(
        master.address
      );

      // Check payment (3 participants)
      const expectedPayment = lobbyParams.amountPerParticipant * 3n;
      expect(masterBalanceAfter).to.equal(
        masterBalanceBefore + expectedPayment - BigInt(gasUsed)
      );

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(3); // LobbyState.Completed
    });

    it('Should revert if lobby does not exist', async function () {
      const { mentora, master } = await loadFixture(deployMentora);

      await expect(
        mentora.connect(master).completeLobby(999)
      ).to.be.revertedWith('Lobby does not exist');
    });

    it('Should revert if not called by master', async function () {
      const { mentora, creator, participant1 } =
        await createAcceptedLobbyWithParticipants();

      // Creator tries to complete (but is not master)
      await expect(
        mentora.connect(creator).completeLobby(1)
      ).to.be.revertedWith('Only lobby master can complete');

      // Participant tries to complete
      await expect(
        mentora.connect(participant1).completeLobby(1)
      ).to.be.revertedWith('Only lobby master can complete');

      // Random user tries to complete
      const signers = await hre.ethers.getSigners();
      await expect(
        mentora.connect(signers[7]).completeLobby(1)
      ).to.be.revertedWith('Only lobby master can complete');
    });

    it('Should revert if lobby is not in Accepted state', async function () {
      const { mentora, master } = await createCreatedLobbyWithParticipants();

      // Try to complete lobby in Created state
      await expect(mentora.connect(master).completeLobby(1)).to.be.revertedWith(
        'Lobby must be accepted to be completed'
      );
    });

    it('Should revert if lobby is in Cancelled state', async function () {
      const { mentora, master } = await createCreatedLobbyWithParticipants();

      // Cancel lobby first
      await mentora.connect(master).cancelLobby(1);

      // Try to complete cancelled lobby
      await expect(mentora.connect(master).completeLobby(1)).to.be.revertedWith(
        'Lobby must be accepted to be completed'
      );
    });

    it('Should revert if lobby is already completed', async function () {
      const { mentora, master } = await createAcceptedLobbyWithParticipants();

      // Complete lobby first time
      await mentora.connect(master).completeLobby(1);

      // Try to complete again
      await expect(mentora.connect(master).completeLobby(1)).to.be.revertedWith(
        'Lobby must be accepted to be completed'
      );
    });

    it('Should revert if no funds to transfer', async function () {
      const { mentora, master } = await createAcceptedEmptyLobby();

      // Try to complete empty lobby (no participants, no funds)
      await expect(mentora.connect(master).completeLobby(1)).to.be.revertedWith(
        'No funds to transfer'
      );
    });

    it('Should make lobby unusable after completion', async function () {
      const { mentora, master, participant1 } =
        await createAcceptedLobbyWithParticipants();

      // Complete lobby
      await mentora.connect(master).completeLobby(1);

      // Try to join completed lobby
      const signers = await hre.ethers.getSigners();
      await expect(
        mentora.connect(signers[7]).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Lobby is not accepting participants');

      // Try to abandon from completed lobby
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Cannot abandon lobby after it has been accepted');

      // Try to accept completed lobby again
      await expect(mentora.connect(master).acceptLobby(1)).to.be.revertedWith(
        'Lobby cannot be accepted in current state'
      );

      // Try to cancel completed lobby
      await expect(mentora.connect(master).cancelLobby(1)).to.be.revertedWith(
        'Lobby cannot be cancelled in current state'
      );
    });

    it('Should handle single participant completion', async function () {
      const { mentora, creator, master, participant1 } = await loadFixture(
        deployMentora
      );

      // Create lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Add single participant
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Accept and complete lobby
      await mentora.connect(master).acceptLobby(1);

      const masterBalanceBefore = await hre.ethers.provider.getBalance(
        master.address
      );

      const tx = await mentora.connect(master).completeLobby(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const masterBalanceAfter = await hre.ethers.provider.getBalance(
        master.address
      );

      // Check payment (1 participant)
      const expectedPayment = lobbyParams.amountPerParticipant;
      expect(masterBalanceAfter).to.equal(
        masterBalanceBefore + expectedPayment - BigInt(gasUsed)
      );

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(3); // LobbyState.Completed
      expect(lobbyInfo.totalDeposited).to.equal(0);
    });
  });
});
