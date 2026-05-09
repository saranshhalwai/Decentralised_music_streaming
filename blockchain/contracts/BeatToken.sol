// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BeatToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    mapping(address => bool) public hasClaimedFaucet;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10 ** 18;
    
    address public minter;

    constructor() ERC20("BeatToken", "BEAT") ERC20Permit("BeatToken") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function claimFaucet() public {
        require(!hasClaimedFaucet[msg.sender], "Already claimed");
        hasClaimedFaucet[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Allows the minter (MusicRegistry) or the owner to reward contributors.
     */
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner() || msg.sender == minter, "Not authorized to mint");
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
