import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Join Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

  describe('Join Lobby', function () {
    const lobbyParams = {
      maxParticipants: 3,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for joining',
    };

    async function createTestLobby() {
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

    it('Should allow participant to join lobby successfully', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);
      const {} = await createTestLobby();

      const tx = await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Check lobby state
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(1);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant
      );
      expect(lobbyInfo.state).to.equal(0); // Still Created

      // Check participant list
      const participants = await mentora.getParticipants(1);
      expect(participants).to.deep.equal([participant1.address]);

      // Check participant deposit
      const deposit = await mentora.getParticipantDeposit(
        1,
        participant1.address
      );
      expect(deposit).to.equal(lobbyParams.amountPerParticipant);
    });

    it('Should emit ParticipantJoined event', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);
      await createTestLobby();

      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      )
        .to.emit(mentora, 'ParticipantJoined')
        .withArgs(
          1, // lobbyId
          participant1.address,
          lobbyParams.amountPerParticipant,
          1 // currentParticipants after joining
        );
    });

    it('Should allow multiple participants to join', async function () {
      const { mentora, participant1, participant2 } = await loadFixture(
        deployMentora
      );
      await createTestLobby();

      // First participant joins
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Second participant joins
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Check final state
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(2);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );

      // Check participant list
      const participants = await mentora.getParticipants(1);
      expect(participants).to.deep.equal([
        participant1.address,
        participant2.address,
      ]);

      // Check individual deposits
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(lobbyParams.amountPerParticipant);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(lobbyParams.amountPerParticipant);
    });

    it('Should revert if lobby does not exist', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);

      await expect(
        mentora.connect(participant1).joinLobby(999, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Lobby does not exist');
    });

    it('Should revert if lobby is not in Created state', async function () {
      const { mentora, creator, master, participant1 } = await loadFixture(
        deployMentora
      );

      // Create and accept lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      await mentora.connect(master).acceptLobby(1);

      // Try to join accepted lobby
      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Lobby is not accepting participants');
    });

    it('Should revert if lobby is full', async function () {
      const { mentora, participant1, participant2 } = await loadFixture(
        deployMentora
      );
      const signers = await hre.ethers.getSigners();
      await createTestLobby();

      // Fill the lobby (maxParticipants = 3)
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(signers[5]).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Try to join when full
      await expect(
        mentora.connect(signers[6]).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Lobby is full');
    });

    it('Should revert if participant already joined', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);
      await createTestLobby();

      // First join - should succeed
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Second join attempt - should fail
      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: lobbyParams.amountPerParticipant,
        })
      ).to.be.revertedWith('Already joined this lobby');
    });

    it('Should revert if incorrect payment amount', async function () {
      const { mentora, participant1 } = await loadFixture(deployMentora);
      await createTestLobby();

      // Too little
      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: lobbyParams.amountPerParticipant - 1n,
        })
      ).to.be.revertedWith('Incorrect payment amount');

      // Too much
      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: lobbyParams.amountPerParticipant + 1n,
        })
      ).to.be.revertedWith('Incorrect payment amount');

      // Zero
      await expect(
        mentora.connect(participant1).joinLobby(1, {
          value: 0,
        })
      ).to.be.revertedWith('Incorrect payment amount');
    });

    it('Should track total deposited correctly', async function () {
      const { mentora, participant1, participant2 } = await loadFixture(
        deployMentora
      );
      await createTestLobby();

      // Initial state
      let lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.totalDeposited).to.equal(0);

      // First participant
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant
      );

      // Second participant
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 2n
      );
    });

    it('Should handle filling lobby to capacity', async function () {
      const { mentora, participant1, participant2 } = await loadFixture(
        deployMentora
      );
      const signers = await hre.ethers.getSigners();
      await createTestLobby();

      // Fill to capacity (3 participants)
      await mentora.connect(participant1).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(participant2).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });
      await mentora.connect(signers[5]).joinLobby(1, {
        value: lobbyParams.amountPerParticipant,
      });

      // Verify lobby is at capacity
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.currentParticipants).to.equal(3);
      expect(lobbyInfo.maxParticipants).to.equal(3);
      expect(lobbyInfo.totalDeposited).to.equal(
        lobbyParams.amountPerParticipant * 3n
      );

      // Verify all participants are recorded
      const participants = await mentora.getParticipants(1);
      expect(participants.length).to.equal(3);
      expect(participants).to.include(participant1.address);
      expect(participants).to.include(participant2.address);
      expect(participants).to.include(signers[5].address);
    });
  });
});
