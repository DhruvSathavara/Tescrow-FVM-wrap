
require("hardhat-deploy")
require("hardhat-deploy-ethers")

const { networkConfig } = require("../helper-hardhat-config")


const private_key = network.config.accounts[0]
const wallet = new ethers.Wallet(private_key, ethers.provider)

module.exports = async ({ deployments }) => {
    console.log("Wallet Ethereum Address:", wallet.address)
    // const chainId = network.config.chainId
    // const tokensToBeMinted = networkConfig[chainId]["tokensToBeMinted"]

    //deploy tescrowDevs
    const tescrowDevs = await ethers.getContractFactory('TescrowDev', wallet);
    console.log('Deploying tescrowDevs...');
    const TescrowDevsNFT = await tescrowDevs.deploy();
    await TescrowDevsNFT.deployed()
    console.log('TescrowDevsNFT deployed to:', TescrowDevsNFT.address);

    //deploy auctionEscrow
    const auctionEscrow = await ethers.getContractFactory('Auction', wallet);
    console.log('Deploying auctionEscrow...');
    const AuctionEscrow = await auctionEscrow.deploy(TescrowDevsNFT.address);
    await AuctionEscrow.deployed()
    console.log('AuctionEscrow deployed to:', AuctionEscrow.address);

    //deploy escrow
    const escrow = await ethers.getContractFactory('Escrow', wallet);
    console.log('Deploying escrow...');
    const Escrow = await escrow.deploy();
    await Escrow.deployed()
    console.log('Escrow deployed to:', Escrow.address);
}