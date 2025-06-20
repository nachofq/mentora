import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora', function () {
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
  });

  describe('Create Lobby', function () {
    const lobbyParams = {
      master: null as any, // Will be set in each test
      maxParticipants: 5,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for blockchain mentoring',
    };

    it('Should create a lobby successfully', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      lobbyParams.master = master.address;

      const tx = await mentora
        .connect(creator)
        .createLobby(
          lobbyParams.master,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Check that lobby was created
      const lobbyInfo = await mentora.getLobbyInfo(1);

      expect(lobbyInfo.id).to.equal(1);
      expect(lobbyInfo.creator).to.equal(creator.address);
      expect(lobbyInfo.master).to.equal(master.address);
      expect(lobbyInfo.description).to.equal(lobbyParams.description);
      expect(lobbyInfo.amountPerParticipant).to.equal(
        lobbyParams.amountPerParticipant
      );
      expect(lobbyInfo.maxParticipants).to.equal(lobbyParams.maxParticipants);
      expect(lobbyInfo.currentParticipants).to.equal(0);
      expect(lobbyInfo.state).to.equal(0); // LobbyState.Created
      expect(lobbyInfo.totalDeposited).to.equal(0);
    });

    it('Should emit LobbyCreated event', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      lobbyParams.master = master.address;

      await expect(
        mentora
          .connect(creator)
          .createLobby(
            lobbyParams.master,
            lobbyParams.maxParticipants,
            lobbyParams.amountPerParticipant,
            lobbyParams.description
          )
      )
        .to.emit(mentora, 'LobbyCreated')
        .withArgs(
          1, // lobbyId
          creator.address,
          master.address,
          lobbyParams.description,
          lobbyParams.amountPerParticipant,
          lobbyParams.maxParticipants
        );
    });

    it('Should increment lobby IDs correctly', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      lobbyParams.master = master.address;

      // Create first lobby
      await mentora
        .connect(creator)
        .createLobby(
          lobbyParams.master,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          'First lobby'
        );

      // Create second lobby
      await mentora
        .connect(creator)
        .createLobby(
          lobbyParams.master,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          'Second lobby'
        );

      // Check IDs
      const lobby1 = await mentora.getLobbyInfo(1);
      const lobby2 = await mentora.getLobbyInfo(2);

      expect(lobby1.id).to.equal(1);
      expect(lobby1.description).to.equal('First lobby');
      expect(lobby2.id).to.equal(2);
      expect(lobby2.description).to.equal('Second lobby');

      // Check total lobbies
      expect(await mentora.getTotalLobbies()).to.equal(2);
    });

    it('Should revert if master is zero address', async function () {
      const { mentora, creator } = await loadFixture(deployMentora);

      await expect(
        mentora
          .connect(creator)
          .createLobby(
            hre.ethers.ZeroAddress,
            lobbyParams.maxParticipants,
            lobbyParams.amountPerParticipant,
            lobbyParams.description
          )
      ).to.be.revertedWith('Master cannot be zero address');
    });

    it('Should revert if maxParticipants is zero', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await expect(
        mentora
          .connect(creator)
          .createLobby(
            master.address,
            0,
            lobbyParams.amountPerParticipant,
            lobbyParams.description
          )
      ).to.be.revertedWith('Max participants must be greater than 0');
    });

    it('Should revert if amountPerParticipant is zero', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await expect(
        mentora
          .connect(creator)
          .createLobby(
            master.address,
            lobbyParams.maxParticipants,
            0,
            lobbyParams.description
          )
      ).to.be.revertedWith('Amount per participant must be greater than 0');
    });

    it('Should revert if description is empty', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await expect(
        mentora
          .connect(creator)
          .createLobby(
            master.address,
            lobbyParams.maxParticipants,
            lobbyParams.amountPerParticipant,
            ''
          )
      ).to.be.revertedWith('Description cannot be empty');
    });

    it('Should allow creator and master to be different addresses', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.creator).to.equal(creator.address);
      expect(lobbyInfo.master).to.equal(master.address);
      expect(lobbyInfo.creator).to.not.equal(lobbyInfo.master);
    });

    it('Should allow creator and master to be the same address', async function () {
      const { mentora, creator } = await loadFixture(deployMentora);

      await mentora.connect(creator).createLobby(
        creator.address, // same as creator
        lobbyParams.maxParticipants,
        lobbyParams.amountPerParticipant,
        lobbyParams.description
      );

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.creator).to.equal(creator.address);
      expect(lobbyInfo.master).to.equal(creator.address);
    });
  });

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

  describe('Cancel Lobby', function () {
    const lobbyParams = {
      maxParticipants: 3,
      amountPerParticipant: hre.ethers.parseEther('0.1'),
      description: 'Test lobby for cancellation',
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

    it('Should allow master to cancel Created lobby with participants', async function () {
      const { mentora, master, participant1, participant2 } =
        await createLobbyWithParticipants();

      // Get initial balances
      const participant1BalanceBefore = await hre.ethers.provider.getBalance(
        participant1.address
      );
      const participant2BalanceBefore = await hre.ethers.provider.getBalance(
        participant2.address
      );
      const contractBalanceBefore = await hre.ethers.provider.getBalance(
        mentora.target
      );

      await mentora.connect(master).cancelLobby(1);

      // Check lobby state changed to Cancelled
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(2); // LobbyState.Cancelled
      expect(lobbyInfo.totalDeposited).to.equal(0);

      // Check participants got refunded
      const participant1BalanceAfter = await hre.ethers.provider.getBalance(
        participant1.address
      );
      const participant2BalanceAfter = await hre.ethers.provider.getBalance(
        participant2.address
      );

      expect(participant1BalanceAfter).to.equal(
        participant1BalanceBefore + lobbyParams.amountPerParticipant
      );
      expect(participant2BalanceAfter).to.equal(
        participant2BalanceBefore + lobbyParams.amountPerParticipant
      );

      // Check contract balance reduced
      const contractBalanceAfter = await hre.ethers.provider.getBalance(
        mentora.target
      );
      expect(contractBalanceAfter).to.equal(
        contractBalanceBefore - lobbyParams.amountPerParticipant * 2n
      );

      // Check participant deposits reset
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(0);
    });

    it('Should allow master to cancel Accepted lobby with participants', async function () {
      const { mentora, master, participant1, participant2 } =
        await createLobbyWithParticipants();

      // Accept lobby first
      await mentora.connect(master).acceptLobby(1);

      // Verify it's accepted
      let lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(1); // LobbyState.Accepted

      // Get initial balances
      const participant1BalanceBefore = await hre.ethers.provider.getBalance(
        participant1.address
      );
      const participant2BalanceBefore = await hre.ethers.provider.getBalance(
        participant2.address
      );

      // Cancel accepted lobby
      await mentora.connect(master).cancelLobby(1);

      // Check lobby state changed to Cancelled
      lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(2); // LobbyState.Cancelled
      expect(lobbyInfo.totalDeposited).to.equal(0);

      // Check participants got refunded
      const participant1BalanceAfter = await hre.ethers.provider.getBalance(
        participant1.address
      );
      const participant2BalanceAfter = await hre.ethers.provider.getBalance(
        participant2.address
      );

      expect(participant1BalanceAfter).to.equal(
        participant1BalanceBefore + lobbyParams.amountPerParticipant
      );
      expect(participant2BalanceAfter).to.equal(
        participant2BalanceBefore + lobbyParams.amountPerParticipant
      );
    });

    it('Should emit LobbyCancelled and FundsRefunded events', async function () {
      const { mentora, master, participant1, participant2 } =
        await createLobbyWithParticipants();

      const tx = await mentora.connect(master).cancelLobby(1);

      // Check LobbyCancelled event
      await expect(tx)
        .to.emit(mentora, 'LobbyCancelled')
        .withArgs(
          1, // lobbyId
          master.address,
          lobbyParams.amountPerParticipant * 2n // totalRefunded
        );

      // Check FundsRefunded events for each participant
      await expect(tx)
        .to.emit(mentora, 'FundsRefunded')
        .withArgs(1, participant1.address, lobbyParams.amountPerParticipant);

      await expect(tx)
        .to.emit(mentora, 'FundsRefunded')
        .withArgs(1, participant2.address, lobbyParams.amountPerParticipant);
    });

    it('Should allow master to cancel empty lobby', async function () {
      const { mentora, master } = await createEmptyLobby();

      await mentora.connect(master).cancelLobby(1);

      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(2); // LobbyState.Cancelled
      expect(lobbyInfo.totalDeposited).to.equal(0);
      expect(lobbyInfo.currentParticipants).to.equal(0);
    });

    it('Should handle full lobby cancellation', async function () {
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

      // Get initial balances
      const balancesBefore = [
        await hre.ethers.provider.getBalance(participant1.address),
        await hre.ethers.provider.getBalance(participant2.address),
        await hre.ethers.provider.getBalance(signers[5].address),
      ];

      // Cancel full lobby
      await mentora.connect(master).cancelLobby(1);

      // Check all participants got refunded
      const balancesAfter = [
        await hre.ethers.provider.getBalance(participant1.address),
        await hre.ethers.provider.getBalance(participant2.address),
        await hre.ethers.provider.getBalance(signers[5].address),
      ];

      for (let i = 0; i < 3; i++) {
        expect(balancesAfter[i]).to.equal(
          balancesBefore[i] + lobbyParams.amountPerParticipant
        );
      }

      // Check lobby state
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.state).to.equal(2); // LobbyState.Cancelled
      expect(lobbyInfo.totalDeposited).to.equal(0);
    });

    it('Should revert if lobby does not exist', async function () {
      const { mentora, master } = await loadFixture(deployMentora);

      await expect(mentora.connect(master).cancelLobby(999)).to.be.revertedWith(
        'Lobby does not exist'
      );
    });

    it('Should revert if not called by master', async function () {
      const { mentora, creator, participant1 } =
        await createLobbyWithParticipants();

      // Creator tries to cancel (but is not master)
      await expect(mentora.connect(creator).cancelLobby(1)).to.be.revertedWith(
        'Only lobby master can cancel'
      );

      // Participant tries to cancel
      await expect(
        mentora.connect(participant1).cancelLobby(1)
      ).to.be.revertedWith('Only lobby master can cancel');

      // Random user tries to cancel
      const signers = await hre.ethers.getSigners();
      await expect(
        mentora.connect(signers[7]).cancelLobby(1)
      ).to.be.revertedWith('Only lobby master can cancel');
    });

    it('Should revert if lobby is already cancelled', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      // Cancel lobby first time
      await mentora.connect(master).cancelLobby(1);

      // Try to cancel again
      await expect(mentora.connect(master).cancelLobby(1)).to.be.revertedWith(
        'Lobby cannot be cancelled in current state'
      );
    });

    it('Should track total refunded correctly', async function () {
      const { mentora, master } = await createLobbyWithParticipants();

      const tx = await mentora.connect(master).cancelLobby(1);
      const receipt = await tx.wait();

      // Find LobbyCancelled event
      const cancelledEvent = receipt?.logs.find((log: any) => {
        try {
          const parsed = mentora.interface.parseLog(log);
          return parsed?.name === 'LobbyCancelled';
        } catch {
          return false;
        }
      });

      expect(cancelledEvent).to.not.be.undefined;

      if (cancelledEvent) {
        const parsed = mentora.interface.parseLog(cancelledEvent);
        expect(parsed?.args[2]).to.equal(lobbyParams.amountPerParticipant * 2n); // totalRefunded
      }
    });

    it('Should preserve participant list after cancellation', async function () {
      const { mentora, master, participant1, participant2 } =
        await createLobbyWithParticipants();

      // Check participants before cancellation
      const participantsBefore = await mentora.getParticipants(1);
      expect(participantsBefore).to.deep.equal([
        participant1.address,
        participant2.address,
      ]);

      await mentora.connect(master).cancelLobby(1);

      // Participants list should remain (for historical purposes)
      const participantsAfter = await mentora.getParticipants(1);
      expect(participantsAfter).to.deep.equal([
        participant1.address,
        participant2.address,
      ]);

      // But deposits should be reset
      expect(
        await mentora.getParticipantDeposit(1, participant1.address)
      ).to.equal(0);
      expect(
        await mentora.getParticipantDeposit(1, participant2.address)
      ).to.equal(0);
    });

    it('Should allow creator to be different from master', async function () {
      const { mentora, creator, master, participant1 } =
        await createLobbyWithParticipants();

      // Verify creator and master are different
      const lobbyInfo = await mentora.getLobbyInfo(1);
      expect(lobbyInfo.creator).to.not.equal(lobbyInfo.master);

      // Creator should not be able to cancel
      await expect(mentora.connect(creator).cancelLobby(1)).to.be.revertedWith(
        'Only lobby master can cancel'
      );

      // Master should be able to cancel
      const participant1BalanceBefore = await hre.ethers.provider.getBalance(
        participant1.address
      );

      await mentora.connect(master).cancelLobby(1);

      // Verify cancellation worked
      const lobbyInfoAfter = await mentora.getLobbyInfo(1);
      expect(lobbyInfoAfter.state).to.equal(2); // LobbyState.Cancelled

      // Check refund happened
      const participant1BalanceAfter = await hre.ethers.provider.getBalance(
        participant1.address
      );
      expect(participant1BalanceAfter).to.equal(
        participant1BalanceBefore + lobbyParams.amountPerParticipant
      );
    });
  });

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
