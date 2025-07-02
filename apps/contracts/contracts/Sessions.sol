// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SessionsEvents} from "./events/SessionsEvents.sol";
import {ISessions} from "./interfaces/ISessions.sol";
import {MentorsContract} from "./MentorsContract.sol";

contract Sessions is Ownable, Pausable, ISessions, SessionsEvents {
    using SafeERC20 for IERC20;
    IERC20 public token;

    mapping(uint256 => Session) public sessions;

    uint256 public _sessionCounter;
    uint256 public _totalDeposited;
    
    MentorsContract mentors;

    error WithdrawError();
    error MentorNotValid();
    error IncorrectDeposit();
    error IncorrectStartTime();
    error MissingCretorAddress();
    error NotEnoughParticipants();
    error IncorrectMaxParticipants();
    error IncorrectParticipantsLength();
    
    constructor(MentorsContract _mentors, IERC20 _token) Ownable(msg.sender){
        mentors = _mentors;
        token = _token;
    }

    // Sesiones No publicable == "No publicable en el marketplace"
    // Sesiones Publicables == "Publicable en el marketplace"
    // Sesion privada = No cualquiera se puede unir.
    // Sesion pública = Cualquiera se puede unir.
    // How to close a session?
    function createSession(
        address _mentorAddress,
        uint256 _maxParticipants,
        address[] memory participants,
        uint256 _sessionStartTime,
        uint256 _minAmountPerParticipant,
        uint256 _amount,
        bool _privateSession,
        bool _marketplace
    ) external returns (uint256 sessionId) 
    {
        require(mentors.isValidMentor(_mentorAddress), MentorNotValid());
        require(_maxParticipants > 0, IncorrectMaxParticipants());
        // Check this start time
        require(_sessionStartTime >= block.timestamp, IncorrectStartTime());
        require(_minAmountPerParticipant >= 1, NotEnoughParticipants());
        require(_amount >= _minAmountPerParticipant, IncorrectDeposit());

        // Create the session
        sessionId = _sessionCounter++;
        Session storage newSession = sessions[sessionId];
        
        //address[] memory participants = new address[](_maxParticipants);
        if (_privateSession) {
            require(participants.length == _maxParticipants, IncorrectParticipantsLength());
            require(_amount >= _minAmountPerParticipant * participants.length);
        }

        _totalDeposited += _amount;

        newSession.creator = msg.sender;
        newSession.mentor = _mentorAddress;
        newSession.startTime = _sessionStartTime;
        newSession.amountPerParticipant = _minAmountPerParticipant;
        newSession.maxParticipants = _maxParticipants;
        newSession.participants = participants;
        newSession.participantDeposits[msg.sender] = _amount;
        newSession.state = SessionState.Created;
        newSession.sessionDeposited += _amount;
        newSession.privateSession = _privateSession;
        newSession.marketplace = _marketplace;

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit LogCreateSession(msg.sender, _mentorAddress, _sessionStartTime, sessionId);
    }

    error SessionNotOpen();
    error SessionIsFull();
    error AddressIsParticipant();
    error IncorrectAmount();
    // Placeholder functions for interface compliance
    function joinSession(uint256 _sessionId, uint _amount) external {
        Session storage session = sessions[_sessionId];

        // Validations
        require(_sessionId != 0, "Lobby does not exist");
        require(
            session.state == SessionState.Created,
            SessionNotOpen()
        );

        require(
            session.participants.length < session.maxParticipants,
            SessionIsFull()
        );
        require(
            session.participantDeposits[msg.sender] == 0,
            AddressIsParticipant()
        );

        require(
            _amount >= session.amountPerParticipant,
            IncorrectAmount()
        );

        // Update session state
        session.participants.push(msg.sender);
        session.participantDeposits[msg.sender] = _amount;
        session.sessionDeposited += _amount;

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit SessionsEvents.ParticipantJoined(
            _sessionId,
            msg.sender,
            _amount,
            session.participants.length
        );
    } 

    function completeLobby(uint256 lobbyId) external {
        Session storage session = sessions[lobbyId];

        // Validations
        //require(lobby.id != 0, "Lobby does not exist");
        require(
            session.state == SessionState.Accepted,
            "Lobby must be accepted to be completed"
        );
        require(msg.sender == session.mentor, "Only lobby master can complete");
        //require(session.totalDeposited > 0, "No funds to transfer");

        uint256 totalPayment = session.sessionDeposited;

        // Update lobby state first (reentrancy protection)
        session.state = SessionState.Completed;
        session.sessionDeposited = 0;

        // Clear all participant deposits
        for (uint256 i = 0; i < session.participants.length; i++) {
            address participant = session.participants[i];
            session.participantDeposits[participant] = 0;
        }

        // Transfer all funds to the master
        token.safeTransfer(address(this), totalPayment);
        
        //emit MentoraEvents.LobbyCompleted(lobbyId, lobby.master, totalPayment);
    }



    function withdraw(IERC20 _token, address recipient, uint256 amount) 
        onlyOwner
        public 
    {
        require(amount > getContractBalance(_token), WithdrawError());
        _token.safeTransfer(recipient, amount);
    }

    function getContractBalance(IERC20 _token) public view returns(uint256){
        return _token.balanceOf(address(this));
    }

}