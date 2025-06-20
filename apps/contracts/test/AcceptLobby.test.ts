import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Accept Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

  describe('Accept Lobby', function () {
    const lobbyParams = {
      maxParticipants: 3,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for acceptance',
    };

    async function createLobbyWithParticipants() {
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

      return { mentora, creator, master, participant1, participant2 };
    }

    async function createEmptyLobby() {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      return { mentora, creator, master };
    }

    it('Should allow master to accept lobby successfully', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      await mentora.connect(master).acceptLobby(1);

      // Check that lobby state changed to Accepted
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(1); // LobbyState.Accepted

      // Other fields should remain unchanged
      expect(lobbyInfo.currentParticipants).to.equal(2);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );
    });

    it('Should emit LobbyAccepted event', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      await expect(mentora.connect(master).acceptLobby(1))
        .to.emit(mentora, 'LobbyAccepted')
        .withArgs(
          1, // lobbyId
          master.address,
          lobbyParams.amountPerParticipant * 2n // totalAmount (2 participants)
        );
    });

    it('Should allow master to accept empty lobby', async function () {
      const { mentora, master } = await createEmptyLobby();

      await mentora.connect(master).acceptLobby(1);

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(1); // LobbyState.Accepted
      expect(lobbyInfo.currentParticipants).to.equal(0);
      expect(lobbyInfo.totalDeposited).to.equal(0);
    });

    it('Should allow master to accept lobby at full capacity', async function () {
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

      // Accept full lobby
      await mentora.connect(master).acceptLobby(1);

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(1); // LobbyState.Accepted
      expect(lobbyInfo.currentParticipants).to.equal(3);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 3n
      );
    });

    it('Should revert if lobby does not exist', async function () {
      const { mentora, master } = await loadFixture(deployMentora);

      await expect(mentora.connect(master).acceptLobby(999)).to.be.revertedWith(
        'Lobby does not exist'
      );
    });

    it('Should revert if not called by master', async function () {
      const { mentora, creator, participant1 } =
        await createLobbyWithParticipants();

      // Creator tries to accept (but is not master)
      await expect(mentora.connect(creator).acceptLobby(1)).to.be.revertedWith(
        'Only lobby master can accept'
      );

      // Participant tries to accept
      await expect(
        mentora.connect(participant1).acceptLobby(1)
      ).to.be.revertedWith('Only lobby master can accept');

      // Random user tries to accept
      const signers = await hre.ethers.getSigners();
      await expect(
        mentora.connect(signers[7]).acceptLobby(1)
      ).to.be.revertedWith('Only lobby master can accept');
    });

    it('Should revert if lobby is not in Created state', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      // Accept lobby first time
      await mentora.connect(master).acceptLobby(1);

      // Try to accept again
      await expect(mentora.connect(master).acceptLobby(1)).to.be.revertedWith(
        'Lobby cannot be accepted in current state'
      );
    });

    it('Should revert if lobby is in Cancelled state', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      // Cancel lobby first
      await mentora.connect(master).cancelLobby(1);

      // Try to accept cancelled lobby
      await expect(mentora.connect(master).acceptLobby(1)).to.be.revertedWith(
        'Lobby cannot be accepted in current state'
      );
    });

    it('Should prevent new participants from joining after acceptance', async function () {
      const { mentora, master } = await createLobbyWithParticipants();
      const signers = await hre.ethers.getSigners();

      // Accept lobby
      await mentora.connect(master).acceptLobby(1);

      // Try to join after acceptance
      await expect(
        mentora.connect(signers[7]).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Lobby is not accepting participants');
    });

    it('Should prevent participants from abandoning after acceptance', async function () {
      const { mentora, master, participant1 } =
        await createLobbyWithParticipants();

      // Accept lobby
      await mentora.connect(master).acceptLobby(1);

      // Try to abandon after acceptance
      await expect(
        mentora.connect(participant1).abandonLobby(1)
      ).to.be.revertedWith('Cannot abandon lobby after it has been accepted');
    });

    it('Should lock funds correctly', async function () {
      const { mentora, master, participant1, participant2 } =
        await createLobbyWithParticipants();

      const contractBalanceBefore = await hre.ethers.provider.getBalance(
        mentora.target
      );

      // Accept lobby
      await mentora.connect(master).acceptLobby(1);

      // Contract should still hold the funds
      const contractBalanceAfter = await hre.ethers.provider.getBalance(
        mentora.target
      );
      expect(contractBalanceAfter).to.equal(contractBalanceBefore);
      expect(contractBalanceAfter).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );

      // Lobby info should still show the deposits
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );

      // Individual deposits should be preserved
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(lobbyParams.amountPerParticipant);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(lobbyParams.amountPerParticipant);
    });

    it('Should allow creator to be different from master', async function () {
      const { mentora, creator, master } = await createLobbyWithParticipants();

      // Verify creator and master are different
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.creator).to.not.equal(lobbyInfo.master);
      expect(lobbyInfo.creator).to.equal(creator.address);
      expect(lobbyInfo.master).to.equal(master.address);

      // Only master should be able to accept
      await expect(mentora.connect(creator).acceptLobby(1)).to.be.revertedWith(
        'Only lobby master can accept'
      );

      // Master should be able to accept
      await mentora.connect(master).acceptLobby(1);

      const updatedLobbyInfo = await mentora.getLobbyInfo(1);
      expect(updatedLobbyInfo.state).to.equal(1); // LobbyState.Accepted
    });
  });
});
