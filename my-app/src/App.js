import React, { useEffect, useRef, useState } from 'react';
import { ethers, Contract, providers, Signer } from 'ethers';
import './App.css';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from './constants';
import Web3Modal from "web3modal";
import HomeCategory from './components/Home/Home';
import FreelanceEscrow from './Escrows/FreelanceEscrow';
import Auction from './Escrows/Auction';

function App() {

    return(
        <>
        {/* <HomeCategory></HomeCategory> */}
        <FreelanceEscrow></FreelanceEscrow>
        <Auction></Auction>
        </>
    )


}

export default App;