// SPDX-License-Identifire: MIT
pragma solidity ^0.8.1;

interface ITescrowDevsNFT {
    function balanceOf(address owner) external view returns (uint256);

}

contract Auction {

    struct AuctionAgreement {
        uint256 auctionId;
        string title;
        address payable owner;
        uint256 msp;
        bool auctionEnd;
        uint256 auctionStartTime;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        bool fundsReleased;
    }
    uint public constant interval = 2 minutes;
    uint256 public numOfAuction;
    mapping(uint256 => AuctionAgreement) public auctions;
    mapping(uint256 => address[]) bidders; // Auction will have list of bidders so here auction id will be key.
    mapping(uint256 => mapping(address => uint256)) bids; // Auction will have address and address will have bid value.
    ITescrowDevsNFT tescrowDevsNFT;

    constructor(address _tescrowdevNFT) payable {
        tescrowDevsNFT = ITescrowDevsNFT(_tescrowdevNFT);
    }

    modifier nftHolderOnly() {
        require(
            tescrowDevsNFT.balanceOf(msg.sender) > 0,
            "You are not CryproDev NFT holder!!!"
        );
        _;
    }

    function getBidders(uint256 _auctionId)
        public
        view
        returns (address[] memory)
    {
        return bidders[_auctionId];
    }

    function getBids(uint256 _auctionId, address _bidder)
        public
        view
        returns (uint256)
    {
        return bids[_auctionId][_bidder];
    }

    function createAuctionContract(address payable _owner, string memory _title)
        public
        payable
    {
        require(msg.sender != address(0), "invalid address");
        AuctionAgreement storage auctionAgreement = auctions[numOfAuction];
        auctionAgreement.auctionId = numOfAuction;
        auctionAgreement.title = _title;
        auctionAgreement.owner = _owner;
        auctionAgreement.msp = msg.value;
        auctionAgreement.auctionEnd = false;
        // getHighestBid(numOfAuction);
        // auctionAgreement.auctionStartTime = block.timestamp;
        numOfAuction++;
    }

    function startAuction(uint256 _auctionId, uint256 _auctionEndTime) public {
        require(
            auctions[_auctionId].owner == msg.sender,
            "you are not owner of this auction"
        );
        require(_auctionEndTime > block.timestamp, "invalid end time");
        auctions[_auctionId].auctionStartTime = block.timestamp;
        auctions[_auctionId].auctionEndTime = _auctionEndTime;
    }

    function bid(uint256 _auctionId) public payable nftHolderOnly{
        require(
            auctions[_auctionId].owner != msg.sender,
            "Owner can't make a bid"
        );
        require(
            auctions[_auctionId].auctionStartTime <= block.timestamp &&
                auctions[_auctionId].auctionEndTime >= block.timestamp,
            "Auction's Time is up!!!"
        );
        require(
            msg.value >= auctions[_auctionId].msp,
            "bid must be greater than msp"
        );
        require(
            msg.value > auctions[_auctionId].highestBid,
            "Bid should be higher than Highest Bid"
        );
        bids[_auctionId][msg.sender] = msg.value;
        bidders[_auctionId].push(payable(msg.sender));
        getHighestBid(_auctionId);
    }

    function refundBids(uint256 _auctionId) public payable {
        for (uint256 index = 0; index < bidders[_auctionId].length; index++) {
            if (
                bidders[_auctionId][index] != auctions[_auctionId].highestBidder
            ) {
                payable(bidders[_auctionId][index]).transfer(
                    bids[_auctionId][bidders[_auctionId][index]]
                );
            }
        }
    }

    

    function endAuction() public {
        for(uint i = 0; i < numOfAuction; i++){
            if(block.timestamp >= auctions[i].auctionEndTime){
                auctions[i].auctionEnd = true;
            }
        }
        
    }

    function timer() public {
        uint currentTime = block.timestamp;
        uint nextRun = currentTime + interval;
        while (block.timestamp < nextRun) {
            // wait until next interval
        }
        endAuction();
    }

    function getHighestBid(uint256 _auctionId) public {
        address highestbidder;
        uint256 highestbid = 0;
        for (uint256 i = 0; i < bidders[_auctionId].length; i++) {
            if (bids[_auctionId][bidders[_auctionId][i]] > highestbid) {
                highestbid = bids[_auctionId][bidders[_auctionId][i]];
                highestbidder = bidders[_auctionId][i];
            }
        }
        auctions[_auctionId].highestBidder = highestbidder;
        auctions[_auctionId].highestBid = highestbid;
        // return (highestbidder, highestbid);
    }

    function releaseFunds(uint256 _auctionId) public payable {
        require(
            auctions[_auctionId].owner == msg.sender,
            "Only the Owner can approve release of funds."
        );
        require(
            !auctions[_auctionId].fundsReleased,
            "Funds have already been released for this Auction agreement."
        );
        // require(
        //      auctions[_auctionId].funds >= 0,
        //     "There are no funds to release."
        // );
        auctions[_auctionId].fundsReleased = true;
        auctions[_auctionId].owner.transfer(auctions[_auctionId].highestBid);
        auctions[_auctionId].owner.transfer(auctions[_auctionId].msp);
        refundBids(_auctionId);
    }

    receive() external payable {}

    fallback() external payable {}
}
