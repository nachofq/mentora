// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SessionsEvents} from "./events/SessionsEvents.sol";
import {ISessions} from "./interfaces/ISessions.sol";
import {MentorsContract} from "./MentorsContract.sol";

contract Participants is Ownable, Pausable{
    
    struct SessionLog{
        address _sessionContract;
        uint256 _sessionID;
    }

    mapping(address => SessionLog[]) public sessionLog;

    constructor() Ownable(msg.sender){}

}