import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Cancel Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

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
});
