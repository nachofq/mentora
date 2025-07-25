import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('Mentora - Create Lobby', function () {
  async function deployMentora() {
    const [owner, creator, master, participant1, participant2] =
      await hre.ethers.getSigners();
    const Mentora = await hre.ethers.getContractFactory('Mentora');
    const mentora = await Mentora.deploy();
    return { mentora, owner, creator, master, participant1, participant2 };
  }

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

    it("Should add lobby to master's lobby list when created", async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      // Check master has no lobbies initially
      let masterLobbies = await mentora.connect(master).getMyLobbiesAsMaster();
      expect(masterLobbies.length).to.equal(0);

      // Create lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Check master now has one lobby
      masterLobbies = await mentora.connect(master).getMyLobbiesAsMaster();
      expect(masterLobbies.length).to.equal(1);
      expect(masterLobbies[0]).to.equal(1);
    });

    it("Should not add lobby to creator's lobby list if creator is not master", async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      // Check creator has no lobbies initially
      let creatorLobbies = await mentora
        .connect(creator)
        .getMyLobbiesAsMaster();
      expect(creatorLobbies.length).to.equal(0);

      // Create lobby with different master
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Check creator still has no lobbies as master
      creatorLobbies = await mentora.connect(creator).getMyLobbiesAsMaster();
      expect(creatorLobbies.length).to.equal(0);

      // But master should have the lobby
      const masterLobbies = await mentora
        .connect(master)
        .getMyLobbiesAsMaster();
      expect(masterLobbies.length).to.equal(1);
      expect(masterLobbies[0]).to.equal(1);
    });

    it("Should add lobby to creator's lobby list when creator is also master", async function () {
      const { mentora, creator } = await loadFixture(deployMentora);

      // Check creator has no lobbies initially
      let creatorLobbies = await mentora
        .connect(creator)
        .getMyLobbiesAsMaster();
      expect(creatorLobbies.length).to.equal(0);

      // Create lobby with creator as master
      await mentora.connect(creator).createLobby(
        creator.address, // creator is master
        lobbyParams.maxParticipants,
        lobbyParams.amountPerParticipant,
        lobbyParams.description
      );

      // Check creator now has one lobby as master
      creatorLobbies = await mentora.connect(creator).getMyLobbiesAsMaster();
      expect(creatorLobbies.length).to.equal(1);
      expect(creatorLobbies[0]).to.equal(1);
    });

    it('Should not add lobby to participant list when creating', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      // Create lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          lobbyParams.description
        );

      // Neither creator nor master should be in participant lists
      const creatorParticipantLobbies = await mentora
        .connect(creator)
        .getMyLobbiesAsParticipant();
      const masterParticipantLobbies = await mentora
        .connect(master)
        .getMyLobbiesAsParticipant();

      expect(creatorParticipantLobbies.length).to.equal(0);
      expect(masterParticipantLobbies.length).to.equal(0);
    });

    it('Should track multiple lobbies for same master', async function () {
      const { mentora, creator, master } = await loadFixture(deployMentora);

      // Create first lobby
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          'First lobby'
        );

      // Create second lobby with same master
      await mentora
        .connect(creator)
        .createLobby(
          master.address,
          lobbyParams.maxParticipants,
          lobbyParams.amountPerParticipant,
          'Second lobby'
        );

      // Check master has both lobbies
      const masterLobbies = await mentora
        .connect(master)
        .getMyLobbiesAsMaster();
      expect(masterLobbies.length).to.equal(2);
      expect(masterLobbies[0]).to.equal(1);
      expect(masterLobbies[1]).to.equal(2);
    });
  });
});
