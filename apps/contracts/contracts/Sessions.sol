// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SessionsEvents} from "./events/SessionsEvents.sol";
import {ISessions} from "./interfaces/ISessions.sol";
import {Mentors} from "./Mentors.sol";

contract Sessions is Ownable, Pausable, ISessions, SessionsEvents {
    using SafeERC20 for IERC20;
    IERC20 public token;

    mapping(uint256 => Session) public sessions;

    uint256 constant PROPORTION = 10000;

    uint256 public _sessionCounter;
    uint256 public _totalDeposited;
    uint256 public fee;
    
    Mentors mentors;

    error SessionError();
    error WithdrawError();
    error SessionIsFull();
    error SessionNotOpen();
    error MentorNotValid();
    error IncorrectAmount();
    error IncorrectDeposit();
    error IsPrivateSession();
    error IncorrectStartTime();
    error MissingCretorAddress();
    error AddressIsParticipant();
    error NotEnoughParticipants();
    error IncorrectMaxParticipants();
    error IncorrectParticipantsLength();
    
    
    constructor(Mentors _mentors, IERC20 _token, uint256 _fee) Ownable(msg.sender){
        mentors = _mentors;
        token = _token;
        fee = _fee; // 500 --> 5%
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
        bool _isPrivate,
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
        
        // If private then we need to deposit the entire session amount
        if (_isPrivate) {
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
        newSession.isPrivateSession = _isPrivate;
        newSession.marketplace = _marketplace;

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit LogCreateSession(msg.sender, _mentorAddress, _sessionStartTime, sessionId);
    }

    // If the session is public, participants must join the session.
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

    function completeSession(uint256 _sessionId) 
        external 
    {
        Session storage session = sessions[_sessionId];

        // Validations
        //require(lobby.id != 0, "Lobby does not exist");
        require(
            session.state == SessionState.Accepted,
            "Lobby must be accepted to be completed"
        );
        require(msg.sender == session.mentor, "Only session mentor can complete");
        require(session.sessionDeposited > 0, "No funds to transfer");

        uint256 totalPayment = session.sessionDeposited;

        // Update lobby state first (reentrancy protection)
        session.state = SessionState.Completed;
        session.sessionDeposited = 0;

        // Clear all participant deposits
        for (uint256 i = 0; i < session.participants.length; i++) {
            address participant = session.participants[i];
            session.participantDeposits[participant] = 0;
        }
        // Get app fees.
        totalPayment = totalPayment - ((totalPayment * fee) / PROPORTION);
        // Transfer all funds to the mentor
        token.safeTransfer(address(this), totalPayment);
        
        emit LogSessionCompleted(_sessionId, session.mentor, totalPayment);
    }

    function withdraw(IERC20 _token, address recipient, uint256 amount) 
        onlyOwner
        public 
    {
        uint256 mentoraFees = getContractBalance(_token) - _totalDeposited;
        require(amount <= mentoraFees, WithdrawError());
        _token.safeTransfer(recipient, amount);

        emit LogWithdraw(msg.sender, mentoraFees);
    }
    
    // ********** View Functions **********
    function getSessionInfo(
        uint256 _sessionId
    )
        external
        view
        returns (
            address creator,
            address mentor,
            uint256 startTime,
            uint256 endTime,
            uint256 amountPerParticipant,
            uint256 maxParticipants,
            address[] memory paparticipants,
            SessionState state,
            uint256 sessionDeposit,
            bool isPrivateSession,
            bool marketplace
        )
    {
        require(
            _sessionId > 0 && _sessionId <= _sessionCounter,
            SessionError()
        );

        Session storage session = sessions[_sessionId];

        return (
            session.creator,
            session.mentor,
            session.startTime,
            session.endTime,
            session.amountPerParticipant,
            session.maxParticipants,
            session.participants,
            session.state,
            session.sessionDeposited,
            session.isPrivateSession,
            session.marketplace
        );
    }

    // Do I need this one?
    function getSessionParticipants(uint256 _sessionId) 
        external 
        view 
        returns (address[] memory)
    {
        Session storage session = sessions[_sessionId];

        return session.participants;
    }

    function getParticipantDeposit(
        uint256 _sessionId,
        address participant
    ) external view returns (uint256){
        Session storage session = sessions[_sessionId];

        return session.participantDeposits[participant];

    }

    function getContractBalance(IERC20 _token) 
        public 
        view 
        returns(uint256)
    {
        return _token.balanceOf(address(this));
    }

}