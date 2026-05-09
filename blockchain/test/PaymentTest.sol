// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";
import "../contracts/Payment.sol";

contract FanProxy {
    receive() external payable {}
    function tip(address paymentAddr, address artist) public payable {
        Payment(paymentAddr).tipArtist{value: msg.value}(artist);
    }
}

contract PaymentTest {
    receive() external payable {}

    function testTipArtistAndEarnings() public {
        MusicRegistry reg = new MusicRegistry();
        Payment payment = new Payment(address(reg));

        FanProxy fan = new FanProxy();
        // fan tips 1 ether to address(this)
        fan.tip{value: 1 ether}(address(payment), address(this));

        require(payment.earningsOf(address(this)) == 1 ether, "earnings not recorded");
    }

    function testWithdrawEarningsResets() public {
        MusicRegistry reg = new MusicRegistry();
        Payment payment = new Payment(address(reg));

        FanProxy fan = new FanProxy();
        fan.tip{value: 1 ether}(address(payment), address(this));

        // withdraw earnings (this contract acts as artist)
        payment.withdrawEarnings();
        require(payment.earningsOf(address(this)) == 0, "earnings not zero after withdraw");
    }
}
