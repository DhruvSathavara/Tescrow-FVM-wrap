import React, { useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
import { ethers, Contract, providers, Signer } from 'ethers';
import { AUCTION_ESCROW_CONTRACT_ADDRESS, AUCTION_ESCROW_ABI,TESCROW_DEVS_NFT_CONTRACT_ADDRESS,TESCROW_DEVS_ABI } from "../constants";
import { Card, CardContent, Box, Button, Checkbox, FormControlLabel, Accordion, AccordionSummary, CircularProgress, Grid, AccordionDetails, TextField, Typography, Select, MenuItem, InputLabel, FormControl, Divider } from "@material-ui/core";
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import dayjs from 'dayjs';
import moment from 'moment'
import { object } from 'prop-types';
export default function Auction() {
    const [title, setTitle] = useState();
    const [clientAddress, setClientAddress] = useState();
    const [everyAuction, setEveryAuction] = useState([]);
    const [StartAuction, setStartAuction] = useState();
    const [auctionEndTime, setAuctionEndTime] = useState();
    const [highestbid, sethighestBid] = useState();
    const [bid, setBid] = useState();
    // console.log(auctionEndTime);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false)
    const [msp, setMsp] = useState(0);
    const [totalNumOfAuctions, setTotalNumOfAuctions] = useState(0);
    const web3ModalRef = useRef();
    const [walletConnected, setWalletConnected] = useState(false);
    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);
        // console.log((await userAddress).toLowerCase())
        const signerForUserAddress = await web3Provider.getSigner();
        const clientAddress = await signerForUserAddress.getAddress();
        setClientAddress(clientAddress);
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 3141) {
            window.alert("Please switch to the Hyperspace network!");
            throw new Error("Please switch to the Hyperspace network");
        }
        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    }
    // console.log('clientAddress:', clientAddress,); 
    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (error) {
            console.log(error);
        }
    }


    const createAuction = async () => {
        // Validate inputs
        if (clientAddress == null || title == null || msp == null) {
            alert('Please enter all required fields.');
            return;
        }
        const signer = await getProviderOrSigner(true);
        const escroContract = getAuctionContractInstance(signer);
        // console.log('clientAddress:', clientAddress);
        // Send the transaction to create the escrow agreement
        const tx = await escroContract.createAuctionContract(clientAddress, title, { value: ethers.utils.parseEther(msp) });
        // console.log('tx====', tx);
        setLoading(true)
        await tx.wait();
        // setAuctionId('');
        setMsp(0)
        setLoading(false);
        alert('Auction  created successfully.');
        alert('MSP  deposited successfully.');
    }
    const startAuction = async (_id) => {
        console.log('_id----', _id);
        const signer = await getProviderOrSigner(true);
        const auctionContract = getAuctionContractInstance(signer);
        const tx = await auctionContract.startAuction(_id, auctionEndTime);
        await tx.wait();
        alert('Auction  Started!!');
    }
    function getReadableTime(mili) {
        if (mili > 0) {
            let date = new Date(mili * 1000);
            let time = date.toLocaleString();
            return time;
        } else {
            return null;
        }
    }
    async function getUinxTime(time) {
        console.log();
        // e.preventDefault();
        let timestamp = await moment(time, "HH:mm").unix();
        // console.log(timestamp)
        setAuctionEndTime(timestamp);
    }


    function ParsedAgreement(_agreeId, _owner, _title, _msp, _starttime, _endtime, _highestBidder, _highestBid, _auctionend, _allBidders, _allBid) {
        this.agreeId = _agreeId;
        this.owner = _owner;
        this.title = _title;
        this.msp = _msp;
        this.starttime = getReadableTime(_starttime);
        this.endtime = getReadableTime(_endtime);
        this.highestBidder = _highestBidder;
        this.highestBid = _highestBid;
        this.auctionEnd = _auctionend;
        this.allBidders = _allBidders;
        this.allBid = _allBid;

    }
    useEffect(() => {
        getTotalNumOfAuction();
        if (totalNumOfAuctions > 0) {
            fetchAllAuctions()
            // GetHighestBid();
        }
    }, [totalNumOfAuctions])
    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet().then(async () => {
                "wallet connected"
            })
        }
    }, []);
    const fetchAuctionById = async (id) => {
        console.log('erntered fetch by id', id);
        try {
            const provider = await getProviderOrSigner();
            const escroContract = getAuctionContractInstance(provider);
            let auction = await escroContract.auctions(id);
            let allbiders = await escroContract.getBidders(id);

            let allBidsAndBiddersArr = [];
            for (let i = 0; i < allbiders.length; i++) {
                let bid = await escroContract.getBids(id, allbiders[i]);
                allBidsAndBiddersArr.push({ [allbiders[i]]: bid.toNumber() / 1000000000000000000 })

            }
            const actn = new ParsedAgreement(id, auction.owner, auction.title,
                auction.msp.toNumber(), auction.auctionStartTime.toNumber(), auction.auctionEndTime.toNumber(), auction.highestBidder, auction.highestBid.toNumber() / 1000000000000000000, auction.auctionEnd, allbiders, allBidsAndBiddersArr)
            console.log('actn--', actn);
            return actn;

        } catch (error) {
            console.log(error);
        };
    }


    const fetchAllAuctions = async () => {
        try {
            const allAuctions = [];
            for (let i = 0; i < totalNumOfAuctions; i++) {
                const auction = await fetchAuctionById(i);
                // console.log('auction..', auction);
                allAuctions.push(auction);
            }
            console.log(allAuctions);
            setEveryAuction(allAuctions);
        } catch (error) {
            console.log(error);
        }
    }
    const getAuctionContractInstance = (providerOrSigner) => {
        return new Contract(
            AUCTION_ESCROW_CONTRACT_ADDRESS,
            AUCTION_ESCROW_ABI,
            providerOrSigner
        );
    };
    const getTotalNumOfAuction = async () => {
        const provider = await getProviderOrSigner();
        const escroContract = getAuctionContractInstance(provider);
        let agreement = await escroContract.numOfAuction();
        setTotalNumOfAuctions(agreement.toNumber())
        // console.log(agreement, 'num of auction');
    }
    // console.log(StartAuction, '--StartAuction');
    const makeAbid = async (id) => {
        console.log('called');
        const signer = await getProviderOrSigner(true);
        const escroContract = getAuctionContractInstance(signer);
        console.log(ethers.utils.parseEther(bid))
        let tx = await escroContract.bid(id, { value: ethers.utils.parseEther(bid) });

        setLoading(true);
        await tx.wait();

        alert('You have made a Bid');
        setLoading(false)

    }

    const ReleaseFunds = async (id) => {

        const signer = await getProviderOrSigner(true);
        const escroContract = getAuctionContractInstance(signer);
        let tx = await escroContract.releaseFunds(id);

        setLoading(true);
        await tx.wait();

        alert('Relese Funds successfully!!!!');
        setLoading(false)
    }

    const GetBidders = async (id) => {
        const signer = await getProviderOrSigner(true);
        const escroContract = getAuctionContractInstance(signer);
        let tx = await escroContract.getBidders(id);

        setLoading(true);
        await tx.wait();

        alert('GetBidders....!!!');
        setLoading(false)
    }
    function truncate(str, max, sep) {
        max = max || 15; var len = str?.length; if (len > max) { sep = sep || "..."; var seplen = sep?.length; if (seplen > max) { return str.substr(len - max) } var n = -0.5 * (max - len - seplen); var center = len / 2; return str.substr(0, center - n) + sep + str.substr(len - center + n); } return str;
    }
    const publicMint = async () => {
        setLoading(true);
        try {
          const signer = await getProviderOrSigner(true);
    
          const nftContract = new Contract(
            TESCROW_DEVS_NFT_CONTRACT_ADDRESS,
            TESCROW_DEVS_ABI,
            signer
          );
          console.log(nftContract);
          // call the presaleMint from the contract, only whitelisted addresses would be able to mint
          const txn = await nftContract.mint({
            // value signifies the cost of one crypto dev which is "0.001" eth.
            // We are parsing `0.001` string to ether using the utils library from ethers.js
            // " utils.parseEther " will convert 0.001 ethers to " wei ".
            value: ethers.utils.parseEther("0.001"),
          });
          await txn.wait();
    
          window.alert("You successfully minted a Public TescrowDevNFT!!")
        } catch (error) {
          console.error(error);
        }
        setLoading(false);
      };


    return (


        <>
            {/* ---------- Create Auction Form ---------------- */}
            <div className="main">
                <div style={{ textAlign: "center" }}>

                    <p><small>Client : <strong style={{ color: "gray" }}>{(truncate(clientAddress))}</strong>
                    </small></p>
                </div>

                <div className="createAgreement section--mid">
                    <div className="section-container section--small createAgreement-form--container ">

                        <form className="agreement-form">
                            <div >
                                <div style={{ marginLeft: "11px" }} className="createAgreement-title">Create Auction</div>
                                <hr className="MuiDivider-root MuiDivider-fullWidth css-39bbo6"></hr>

                                <div className="m-3">
                                    <TextField className="textfield" fullWidth label="Auction Title" id="fullWidth" variant="standard"
                                        onChange={(e) => { setTitle(e.target.value) }} />
                                </div>



                                <div className="row">

                                    <div className="col m-3">
                                        <FormControl style={{ marginTop: "-15px" }} variant="standard" sx={{ m: 1, minWidth: 120 }} fullWidth>
                                            <InputLabel id="demo-simple-select-standard-label">Currency</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-standard-label"
                                                id="demo-simple-select-standard"
                                            >

                                                <MenuItem value="eth">ETH</MenuItem>
                                                <MenuItem value="usd">USD</MenuItem>
                                                <MenuItem value="matic">MATIC</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>

                                    <div className="col m-3">
                                        <TextField style={{ marginTop: "-15px" }} className="textfield" fullWidth label="MSP" type="number" id="fullWidth" variant="standard"
                                            onChange={(e) => { setMsp(e.target.value) }} />
                                    </div>


                                </div>


                                <div>
                                    <center>
                                        {loading ?
                                            <Button style={{ cursor: 'none' }}
                                                className="submit-success-btn-onclick" variant="contained"
                                            >
                                                <CircularProgress style={{ color: 'white', }} />
                                            </Button> :
                                            <Button className="submit-success-btn"
                                                onClick={createAuction}

                                                variant="contained"
                                            // onClick={createAgreement}
                                            >
                                                Create
                                            </Button>
                                        }
                                    </center>
                                </div>

                            </div>
                        </form>
                    </div>
                </div>
            </div>







            <div className="createAgreement section--mid">
                <div className="section-container section--small createAuction-form--container ">
                    <div>
                        <h1 className='myagreement-title' style={{ textAlign: 'center' }}>My Auction </h1>
                        <div className='row' >

                            {everyAuction && everyAuction.map((a) => {
                                return (
                                    <div style={{ width: "48%", marginLeft: "14px" }} className='card text-center col-6 auction-detail-card'>
                                        <div class="card-body">
                                            <div style={{ justifyContent: "start" }} className='row'>
                                                <div className='col-12'>
                                                    <center>
                                                        <h6 className='agreement-buyer-stake'>Auction 's Details </h6>
                                                        <div className='dividerr'></div>
                                                    </center>
                                                </div>



                                                <h6 className='agreement-buyer-stake col-12'>Owner : <strong style={{ color: "gray" }}>{a.owner}</strong></h6>
                                                <h6 style={{ marginLeft: "-161px" }} className='agreement-buyer-stake'>MSP :<span>
                                                    <strong style={{ color: "red" }}> {(a.msp) / 1000000000000000000} Eth</strong>
                                                </span>
                                                </h6>



                                                {
                                                    null != a.endtime ? <h6 style={{ marginLeft: "-4px" }} className='agreement-buyer-stake col-7'>End Time : <strong>{a.endtime}</strong></h6> :
                                                        <div className='row'>
                                                            <div className='col-4'><lable style={{ margin: " 11px 5px 0px -11px" }} className='agreement-buyer-stake '>Set End Time :</lable></div>
                                                            <div className='col-8'> <input className='time-standard'
                                                                type="time"
                                                                onChange={(e) =>
                                                                    getUinxTime(e.target.value)
                                                                }
                                                            /></div>


                                                        </div>
                                                }


                                                {
                                                    null != a.starttime ? <h6 className='agreement-buyer-stake col-7'>Start Time : <strong>{a.starttime}</strong></h6> :
                                                        <div><Button style={{ width: "fit-content", marginTop: "10px" }} className="providerstake-success-btn " variant=""
                                                            onClick={() => startAuction(a?.agreeId)}  >   Start Auction</Button></div>
                                                }

                                                {
                                                    a.highestBid != 0 ? <div>
                                                        <h6 style={{ marginLeft: "-6px" }} className='agreement-buyer-stake col-7'>Highest Bidder : <strong style={{ color: "gray" }}>{(truncate(a.highestBidder))}</strong></h6>
                                                        <h6 style={{ marginLeft: "4px" }} className='agreement-buyer-stake col-5'>Highest Bid :<span>
                                                            <strong style={{ color: "red" }}> {(a.highestBid)} Eth</strong>
                                                        </span>
                                                        </h6>
                                                    </div> : ""
                                                }



                                                {
                                                    a.auctionEnd ? "" :
                                                        <div style={{ justifyContent: "flex-start" }} className='row'>
                                                            <div style={{ marginLeft: "8px" }} className='col-4'><TextField
                                                                className="textfield" fullWidth label="MSP" type="number" id="fullWidth" variant="standard"
                                                                onChange={(e) => { setBid(e.target.value) }} /></div>
                                                            <div className='col-6 mt-3'><Button style={{ width: "fit-content", marginTop: "1px" }} className="providerstake-success-btn " variant=""
                                                                onClick={() => makeAbid(a?.agreeId)}  > Make Bid</Button>
                                                                <button onClick={publicMint}>
                                                                    Public Mint 🚀
                                                                </button></div>
                                                        </div>

                                                }



                                                {
                                                    a.auctionEnd ? <div> {
                                                        clientAddress === a.owner ? <div style={{ marginLeft: "-30px" }} className='offset-0 col-6'> <Button style={{ width: "fit-content" }} className="providerstake-success-btn " variant=""
                                                            onClick={() => ReleaseFunds(a?.agreeId)}  >   Release Fund</Button></div> : ""
                                                    }</div> : ""
                                                }

                                                {
                                                    a.allBid.length === 0 ? "" :
                                                        <Accordion>
                                                            <AccordionSummary
                                                                aria-controls="panel1a-content"
                                                                id="panel1a-header"
                                                            >
                                                                <Typography>See all Bids
                                                                    <div className='allbids-dividerr'></div>

                                                                </Typography>

                                                            </AccordionSummary>
                                                            <AccordionDetails>{
                                                                <ul style={{ padding: "0" }} className='row'>
                                                                    {
                                                                        a.allBid.map((b) => (
                                                                            <li>
                                                                                {
                                                                                    Object.entries(b).map(([key, value]) => (
                                                                                        <p className='col-12' style={{ fontSize: "16px" }}><small>{key} : <strong style={{ color: "GrayText" }}>{value}</strong></small></p>
                                                                                    ))
                                                                                }
                                                                            </li>
                                                                        ))
                                                                    }
                                                                </ul>
                                                            }
                                                            </AccordionDetails>
                                                        </Accordion>
                                                }


                                            </div>
                                        </div>
                                    </div>
                                )
                            })}



                        </div>
                    </div>
                </div>
            </div>






            <div>
                {/* <h2>Created Auctions</h2>           */}
                {
                    everyAuction && everyAuction.map((evryauction) => {
                        return (
                            <>
                                <div style={{ marginLeft: "", marginTop: "50px", border: "1px solid grey", display: "inline-block", padding: "2% 5%" }} className='container offset-2 col-5'>
                                    <p>Agreement Id : {evryauction?.agreeId}</p>
                                    <p>Owner: {evryauction?.owner}</p>
                                    <p>Start Time:{evryauction?.starttime}
                                    </p>
                                    <p>End Time:{evryauction?.endtime}
                                    </p>
                                    {
                                        evryauction?.endtime ? <div>
                                            <button onClick={() => ReleaseFunds(evryauction?.agreeId)}>Relese Funds</button>

                                        </div> :
                                            <div>
                                                <label htmlFor="auctionEndTime">Auction End Time:</label>
                                                <input
                                                    type="time"
                                                    onChange={(e) =>
                                                        getUinxTime(e.target.value)
                                                    }
                                                />
                                            </div>
                                    }


                                    <h3>Title : {evryauction?.title}</h3>
                                    <h4>MSP : {evryauction?.msp / 1000000000000000000} Ether</h4>                                    <div>
                                        <button style={{ margin: "20px" }}
                                            onClick={() => startAuction(evryauction?.agreeId)}
                                        >Start Auction
                                        </button>

                                        <h4>Highest Bidder = {evryauction?.highestBidder}</h4>
                                        <h4>Highest Bid = {evryauction.highestBid} </h4>
                                        <div>
                                            <h1>All bidders </h1>
                                            {
                                                <ul>
                                                    {
                                                        evryauction.allBid.map((bid) => (
                                                            <li>
                                                                {
                                                                    Object.entries(bid).map(([key, value]) => (
                                                                        <p>{key}: {value}</p>
                                                                    ))
                                                                }
                                                            </li>
                                                        ))
                                                    }
                                                </ul>
                                            }
                                        </div>

                                        <div>
                                            <label>Bid:</label>
                                            <input type="number"
                                                onChange={(e) => setBid(e.target.value)}
                                            />
                                            <button
                                                onClick={() => makeAbid(evryauction?.agreeId)}
                                            >Make a Bid</button>
                                        </div>

                                    </div>


                                </div>

                            </>
                        )
                    })
                }
            </div>
            {error && <p>{error}</p>}
        </>)
}