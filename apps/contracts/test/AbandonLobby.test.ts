import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Abandon Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

  describe('Abandon Lobby', function () {
    const lobbyParams = {
      maxParticipants: 4,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for abandonment',
    };

    async function createLobbyWithMultipleParticipants() {
      const { mentora, creator, master, participant1, participant2 } =
        await loadFixture(deployMentora);
      const signers = await hre.ethers.getSigners();

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
      await mentora.connect(signers[5]).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      return {
        mentora,
        creator,
        master,
        participant1,
        participant2,
        participant3: signers[5],
      };
    }

    async function createLobbyWithOneParticipant() {
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

      // Add one participant
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      return { mentora, creator, master, participant1 };
    }

    it('Should allow participant to abandon lobby successfully', async function () {
      const { mentora, participant1 } = await createLobbyWithOneParticipant();

      // Get initial balance
      const participant1BalanceBefore = await hre.ethers.provider.getBalance(
        participant1.address
      );
      const contractBalanceBefore = await hre.ethers.provider.getBalance(
        mentora.target
      );

      // Abandon lobby
      const tx = await mentora.connect(participant1).abandonLobby(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // Check lobby state
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(0);
      expect(lobbyInfo.totalDeposited).to.equal(0);
      expect(lobbyInfo.state).to.equal(0); // Still Created

      // Check participant got refunded (minus gas costs)
      const participant1BalanceAfter = await hre.ethers.provider.getBalance(
        participant1.address
      );
      expect(participant1BalanceAfter).to.equal(
        participant1BalanceBefore + lobbyParams.amountPerParticipant - gasUsed
      );

      // Check contract balance reduced
      const contractBalanceAfter = await hre.ethers.provider.getBalance(
        mentora.target
      );
      expect(contractBalanceAfter).to.equal(
        contractBalanceBefore - lobbyParams.amountPerParticipant
      );

      // Check participant is removed from list
      const participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(0);

      // Check participant deposit reset
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(0);
    });

    it('Should emit ParticipantAbandoned event', async function () {
      const { mentora, participant1 } = await createLobbyWithOneParticipant();

      await expect(mentora.connect(participant1).abandonLobby(1))
        .to.emit(mentora, 'ParticipantAbandoned')
        .withArgs(
          1, // lobbyId
          participant1.address,
          lobbyParams.amountPerParticipant
        );
    });

    it('Should handle abandoning from middle of participants list', async function () {
      const { mentora, participant1, participant2, participant3 } =
        await createLobbyWithMultipleParticipants();

      // Check initial state
      let participants = await mentora.getParticipants(1);
      expect(participants).to.deep.equal([
        participant1.address,
        participant2.address,
        participant3.address,
      ]);

      // Participant2 (middle) abandons
      const participant2BalanceBefore = await hre.ethers.provider.getBalance(
        participant2.address
      );

      const tx = await mentora.connect(participant2).abandonLobby(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // Check participant2 got refunded
      const participant2BalanceAfter = await hre.ethers.provider.getBalance(
        participant2.address
      );
      expect(participant2BalanceAfter).to.equal(
        participant2BalanceBefore + lobbyParams.amountPerParticipant - gasUsed
      );

      // Check participants list updated (participant3 moved to middle, participant2 removed)
      participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(2);
      expect(participants).to.include(participant1.address);
      expect(participants).to.include(participant3.address);
      expect(participants).to.not.include(participant2.address);

      // Check lobby state updated
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(2);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );

      // Check participant2 deposit reset but others preserved
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(lobbyParams.amountPerParticipant);
      expect(
        await mentora.getParticipantDeposit(1, participant3.address)
      ).to.equal(lobbyParams.amountPerParticipant);
    });

    it('Should handle abandoning from end of participants list', async function () {
      const { mentora, participant1, participant2, participant3 } =
        await createLobbyWithMultipleParticipants();

      // Participant3 (last) abandons
      await mentora.connect(participant3).abandonLobby(1);

      // Check participants list updated
      const participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(2);
      expect(participants).to.deep.equal([
        participant1.address,
        participant2.address,
      ]);

      // Check lobby state
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(2);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );
    });

    it('Should handle abandoning from beginning of participants list', async function () {
      const { mentora, participant1, participant2, participant3 } =
        await createLobbyWithMultipleParticipants();

      // Participant1 (first) abandons
      await mentora.connect(participant1).abandonLobby(1);

      // Check participants list updated (participant3 moved to first position)
      const participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(2);
      expect(participants).to.include(participant2.address);
      expect(participants).to.include(participant3.address);
      expect(participants).to.not.include(participant1.address);
    });

    it('Should allow all participants to abandon sequentially', async function () {
      const { mentora, participant1, participant2, participant3 } =
        await createLobbyWithMultipleParticipants();

      // All participants abandon one by one
      await mentora.connect(participant1).abandonLobby(1);
      await mentora.connect(participant2).abandonLobby(1);
      await mentora.connect(participant3).abandonLobby(1);

      // Check lobby is empty
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(0);
      expect(lobbyInfo.totalDeposited).to.equal(0);
      expect(lobbyInfo.state).to.equal(0); // Still Created

      const participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(0);

      // Check all deposits reset
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant3.address)
      ).to.equal(0);
    });

    it('Should revert if lobby does not exist', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);

      await expect(
        mentora.connect(participant1).abandonLobby(999)
      ).to.be.revertedWith('Lobby does not exist');
    });

    it('Should revert if lobby is not in Created state', async function () {
      const { mentora, master, participant1 } =
        await createLobbyWithOneParticipant();

      // Accept lobby
      await mentora.connect(master).acceptLobby(1);

      // Try to abandon accepted lobby
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Cannot abandon lobby after it has been accepted');
    });

    it('Should revert if lobby is cancelled', async function () {
      const { mentora, master, participant1 } =
        await createLobbyWithOneParticipant();

      // Cancel lobby
      await mentora.connect(master).cancelLobby(1);

      // Try to abandon cancelled lobby
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Cannot abandon lobby after it has been accepted');
    });

    it('Should revert if caller is not a participant', async function () {
      const { mentora } = await createLobbyWithOneParticipant();
      const signers = await hre.ethers.getSigners();

      // Random user tries to abandon
      await expect(
        mentora.connect(signers[7]).abandonLobby(1)
      ).to.be.revertedWith('Not a participant in this lobby');
    });

    it('Should revert if participant already abandoned', async function () {
      const { mentora, participant1 } = await createLobbyWithOneParticipant();

      // First abandon - should succeed
      await mentora.connect(participant1).abandonLobby(1);

      // Second abandon attempt - should fail
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Not a participant in this lobby');
    });

    it('Should handle participants rejoining after abandoning', async function () {
      const { mentora, participant1 } = await createLobbyWithOneParticipant();

      // Abandon first
      await mentora.connect(participant1).abandonLobby(1);

      // Check empty state
      let lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(0);

      // Rejoin
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Check rejoined successfully
      lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(1);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant
      );

      const participants = await mentora.getParticipants(1);
      expect(participants).to.deep.equal([participant1.address]);
    });

    it('Should preserve lobby state after partial abandonment', async function () {
      const { mentora, master, participant1, participant2, participant3 } =
        await createLobbyWithMultipleParticipants();

      // One participant abandons
      await mentora.connect(participant2).abandonLobby(1);

      // Master should still be able to accept
      await mentora.connect(master).acceptLobby(1);

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(1); // LobbyState.Accepted
      expect(lobbyInfo.currentParticipants).to.equal(2);

      // Remaining participants should not be able to abandon accepted lobby
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Cannot abandon lobby after it has been accepted');
    });
  });
});
