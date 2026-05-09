// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/Counter.sol";

contract CounterTest {
    function testIncrementEvent() public {
        Counter c = new Counter();
        c.inc();
        // Ensure x() updated
        require(c.x() == 1, "increment failed");
    }

    function testSumOfIncrementsMatches() public {
        Counter c = new Counter();
        for (uint256 i = 1; i <= 10; i++) {
            c.incBy(i);
        }
        uint256 total = c.x();
        uint256 expected = 0;
        for (uint256 i = 1; i <= 10; i++) expected += i;
        require(total == expected, "sum mismatch");
    }
}
