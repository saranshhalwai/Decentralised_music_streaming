// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/BeatToken.sol";

contract NonOwner {
    address public token;
    constructor(address _token) payable {
        token = _token;
    }

    // attempt to call mint() on the token using a low-level call so this helper
    // itself does not revert the whole test. Returns (success, returndata).
    function tryMint(address to, uint256 amount) public returns (bool, bytes memory) {
        (bool success, bytes memory data) = token.call(abi.encodeWithSignature("mint(address,uint256)", to, amount));
        return (success, data);
    }
}

contract BeatTokenTest {
    function testDeployment() public {
        BeatToken token = new BeatToken();
        uint8 d = token.decimals();
        uint256 expected = 1_000_000 * (10 ** uint256(d));
        require(token.totalSupply() == expected, "totalSupply mismatch");
        require(token.balanceOf(address(this)) == expected, "owner balance mismatch");
        require(keccak256(bytes(token.name())) == keccak256(bytes("BeatToken")), "name mismatch");
        require(keccak256(bytes(token.symbol())) == keccak256(bytes("BEAT")), "symbol mismatch");
    }

    function testOwnerCanMint() public {
        BeatToken token = new BeatToken();
        uint8 d = token.decimals();
        uint256 mintAmount = 100 * (10 ** uint256(d));
        token.mint(address(0x1234), mintAmount);
        require(token.balanceOf(address(0x1234)) == mintAmount, "mint failed");
    }

    function testNonOwnerCannotMint() public {
        BeatToken token = new BeatToken();
        NonOwner attacker = new NonOwner(address(token));

        (bool ok, bytes memory data) = attacker.tryMint(address(0x5678), 1);
        require(!ok, "non-owner mint should fail");

        // If returndata contains the revert selector, check it matches OpenZeppelin's Ownable error
        if (data.length >= 4) {
            bytes4 selector;
            assembly { selector := mload(add(data, 32)) }
            bytes4 expected = bytes4(keccak256("OwnableUnauthorizedAccount(address)"));
            require(selector == expected, "unexpected revert selector");
        }
    }
}
