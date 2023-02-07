import React, { useEffect, useRef, useState } from 'react';
import { ethers, Contract, providers, Signer } from 'ethers';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from "../constants";
import Web3Modal from "web3modal";
import { Box, Button, Checkbox, FormControlLabel, Accordion, AccordionSummary, CircularProgress, Grid, AccordionDetails, TextField, Typography, Select, MenuItem, InputLabel, FormControl, Divider } from "@material-ui/core";

function FreelanceEscrow() {

    const [title, setTitle] = useState('');

    const [serviceProviderAddress, setServiceProviderAddress] = useState();
    const [arbitratorAddress, setArbotratorAddress] = useState();
    // console.log(serviceProviderAddress);

    const [clientAddress, setClientAddress] = useState();
    const [loading, setLoading] = useState(false);

    const [everyAgreementAsClient, setEveryAgreementAsClient] = useState([]);
    // const [everyAgreementAsServiceprovider, setEveryAgreementAsServiceprovider] = useState([]);

    const [amount, setAmount] = useState(0);

    let [fund, setFund] = useState(0);


    const [totalNumOfAgreement, setTotalNumOfAgreements] = useState(0);

    const [fundsReleased, setFundsReleased] = useState(false);

    const web3ModalRef = useRef();

    const [walletConnected, setWalletConnected] = useState(false);


    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (error) {
            console.log(error);

        }
    }
    function truncate(str, max, sep) {
        max = max || 15; var len = str?.length; if (len > max) { sep = sep || "..."; var seplen = sep?.length; if (seplen > max) { return str.substr(len - max) } var n = -0.5 * (max - len - seplen); var center = len / 2; return str.substr(0, center - n) + sep + str.substr(len - center + n); } return str;
    }

    const getNumOfAgreements = async () => {
        try {
            const provider = await getProviderOrSigner();
            const contract = getEscrowContractInstance(provider);
            const numOfAgreements = await contract.numOfAgreement();
            setTotalNumOfAgreements(numOfAgreements);

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (totalNumOfAgreement > 0) {
            fetchAllAgreements();
        }
    }, [totalNumOfAgreement])

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet().then(async () => {
                await getNumOfAgreements();
            })
        }
    }, []);



    // Create an escrow agreement and deposite fund
    const createAgreement = async () => {
        // Validate inputs
        if (title == null || clientAddress == null || serviceProviderAddress == null || arbitratorAddress == null || amount == null) {
            alert('Please enter all required fields.');
            return;
        }
        console.log(ethers.utils.parseEther(amount));
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        // Send the transaction to create the escrow agreement
        console.log(fund);

        const tx = await escroContract.createEscrowAgreement(title, clientAddress, serviceProviderAddress, arbitratorAddress, ethers.utils.parseEther(amount), { value: ethers.utils.parseEther(fund) });

        setLoading(true)
        await tx.wait();
        setAmount(0);
        // Update the state to reflect the new escrow agreement
        setFundsReleased(false);

        getNumOfAgreements();
        setLoading(false);
        alert('Funds deposited successfully.');
    }

    function ParsedAgreement(_agreeId, _AgreementTitle, _clientAdd, _providerAdd, _arbitrator, _agreementAmount, _clientStake, _completed, _released, _serviceProviderStake, _dispute, _fundReceiver) {
        this.agreeId = _agreeId;
        this.title = _AgreementTitle;
        this.clientAdd = _clientAdd;
        this.providerAdd = _providerAdd;
        this.arbitratorAdd = _arbitrator;
        this.agreementAmount = _agreementAmount;
        this.clientStake = _clientStake
        this.completed = _completed;
        this.release = _released;
        this.serviceProviderStake = _serviceProviderStake
        this.dispute = _dispute;
        this.fundReceiver = _fundReceiver;
    }



    const fetchAgreementById = async (id) => {
        // console.log('erntered fetch by id', id);

        try {
            const provider = await getProviderOrSigner();
            const escroContract = getEscrowContractInstance(provider);
            let agreement = await escroContract.agreements(id);
            // console.log(agreement);
            const agrmnt = new ParsedAgreement(agreement.agreementID.toNumber(), agreement.title, agreement.client, agreement.serviceProvider, agreement.arbiter, agreement.agreementAmount.toNumber(), agreement.clientStake.toNumber() / 1000000000000000000, agreement.completed, agreement.fundsReleased, agreement.serviceProviderStake.toNumber() / 1000000000000000000, agreement.dispute, agreement.fundreceiver.toNumber())

            console.log(agrmnt, 'agreement by ID');
            return agrmnt;

        } catch (error) {
            console.log(error);
        };
    }




    const fetchAllAgreements = async () => {
        // console.log('erntered fetch all');
        try {
            const allAgreements = [];
            for (let i = 0; i < totalNumOfAgreement; i++) {
                const agreement = await fetchAgreementById(i);

                allAgreements.push(agreement);

            }
            setEveryAgreementAsClient(allAgreements);
        } catch (error) {
            console.log(error);
        }
    }

    // Release the funds to the service provider
    const release = async (id) => {
        // Validate inputs
        console.log(id, 'id');
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        // Send the transaction to release the funds
        const tx = await escroContract.releaseFunds(id);
        await tx.wait();
        // Update the state to reflect the funds being released
        setFundsReleased(true);
        alert('Funds released successfully.');
    }

    const cancel = async (id) => {
        // Validate inputs
        console.log(id, 'id');
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        // Send the transaction to release the funds
        const tx = await escroContract.cancel(id);
        await tx.wait();
        // Update the state to reflect the funds being released
        // setFundsReleased(true);
        alert('Agreement canceled.');
    }


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

    const workCompleted = async (id) => {
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        const tx = await escroContract.completedWork(id);
        await tx.wait();
        alert("Marked your work as completed");
    }

    const getEscrowContractInstance = (providerOrSigner) => {
        return new Contract(
            ESCROW_CONTRACT_ADDRESS,
            ESCROW_ABI,
            providerOrSigner
        );
    };

    const fileDispute = async (id) => {
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        const tx = await escroContract.setDispute(id);
        await tx.wait();
        alert("Filed dispute!!");
    }

    const stakeProviderEth = async (_agreementId, _stakeAmount) => {
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        const tx = await escroContract.stakeProviderEth(_agreementId, { value: _stakeAmount });
        await tx.wait();
        alert('Eth staked successfully.');
    }

    const resolveDispute = async (id, trueORfalse) => {
        console.log(trueORfalse, ' t or f');
        const signer = await getProviderOrSigner(true);
        const escroContract = getEscrowContractInstance(signer);

        const tx = await escroContract.resolveDispute(id, trueORfalse);
        await tx.wait();
        alert(`Funds transfered to ${trueORfalse ? "Client" : "Service provider"} !!`);

    }

    function onlyArbitratorAccess(a) {
        if (clientAddress == a.arbitratorAdd) {
            return (
                <div className='col'>
                    <center><h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Arbitrator : {<strong style={{ color: "gray" }}>{(truncate(a.arbitratorAdd))}</strong>}</h6></center>
                    <center>
                        <h6 style={{ marginBottom: "10px" }} className='agreement-buyer-stake'>Release Funds to  </h6>
                        <span>
                            <Button className="providerstake-success-btn m-2" variant=""
                                onClick={() => resolveDispute(a.agreeId, true)}
                            >
                                Buyer
                            </Button>
                            {/* <span> */}
                            <Button className="providerstake-success-btn m-2" variant=""
                                onClick={() => resolveDispute(a.agreeId, false)}
                            >
                                Seller
                            </Button>
                        </span>
                        {/* </span> */}
                    </center>
                </div>
            )
        }
    }

    function setFundReceiver(a) {
        if (a.fundReceiver === 0) {
            console.log(a);
            return (
                <div className='col-12'>
                    <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Dispute Status : Pending</h6>
                </div>
            )

        }
        else if (a.fundReceiver === 1) {
            return (
                <div className='col-12'>
                    <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Dispute Status : Resolve</h6>
                    <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Fund Released to : {(truncate(a.clientAdd))}</h6>
                </div>
            )

        } else if (a.fundReceiver === 2) {
            return (
                <div className='col-12'>
                    <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Dispute Status : Resolve</h6>
                    <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Fund Released to : {(truncate(a.providerAdd))}</h6>
                </div>
            )

        } else { }
    }



    function renderAgreemetsTab() {
        return (
            <div className="createAgreement section--mid">
                <div className="section-container section--small agrmnt-form--container">
                    <div className="agreements-card">
                        <table className="agreement-table">
                            <div>

                                <thead style={{ width: "100%" }}>
                                    <tr style={{ width: "100%" }} className="agreement-table-row agreement-table-row--header">
                                        <th style={{ width: "10%" }} className="agreement-table-cell agreement-table-cell--header">ID</th>

                                        <th style={{ width: "15%" }} className="agreement-table-cell agreement-table-cell--header">
                                            <div className="agreement-table-cell--header-wrapper">
                                                <span>Title</span>
                                            </div>
                                        </th>

                                        <th style={{ width: "28%" }} className="agreement-table-cell agreement-table-cell--header">
                                            <div className="agreement-table-cell--header-wrapper">
                                                <span>Address</span>
                                            </div>
                                        </th>

                                        <th style={{ width: "27%" }} className="agreement-table-cell agreement-table-cell--header">
                                            <div className="agreement-table-cell--header-wrapper">
                                                <span>Amount</span>
                                            </div>
                                        </th>


                                        <th style={{ width: "0%" }} className="agreement-table-cell agreement-table-cell--header">
                                            <div style={{ marginRight: '145px' }} className="agreement-table-cell--header-wrapper">
                                                <span>Status</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                            </div>



                            {everyAgreementAsClient && everyAgreementAsClient.map((a) => {
                                if (a.clientAdd === clientAddress || a.providerAdd === clientAddress || a.arbitratorAdd === clientAddress) {


                                    if (a.clientAdd === clientAddress || a.arbitratorAdd === clientAddress) {
                                        return (
                                            <div style={{ width: "165%" }}>
                                                <Accordion>
                                                    <AccordionSummary
                                                        // expandIcon={<ExpandMoreIcon />}
                                                        aria-controls="panel1a-content"
                                                        id="panel1a-header"
                                                    >
                                                        <Typography style={{ width: "100%" }}>
                                                            <tbody>

                                                                <tr style={{ borderBottom: '1px solid #ddd' }} className="agreement-tablerow">
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreeId}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.title}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {(truncate(a.clientAdd))}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreementAmount / 1000000000000000000} Eth
                                                                    </td>
                                                                    <td className="transactions-table-cell transactions-table-cell--large transactions-table-cell--last transactions-table-cell@mobile--fullWidth">
                                                                        <div className="transactions-tags-container">
                                                                            <span className="transactions-tags-item transactions-tags-item--awaiting">{a.serviceProviderStake === 0 ? "• Awaiting Agreement" : "• Created Agreement"}</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography style={{ width: "100%" }}>
                                                            <div style={{ width: "61%" }} className='row'>
                                                                <div className='col-12'>
                                                                    <center><h5>Agreement {a.title}'s Details</h5></center>
                                                                    <center>
                                                                        <h6 className='agreement-buyer-stake'>Agreement Amount :<span>
                                                                            <small><strong style={{ color: "red" }}> {(a.agreementAmount) / 1000000000000000000} Eth</strong>
                                                                            </small>
                                                                        </span>
                                                                        </h6>
                                                                        <div className='dividerr'></div>
                                                                    </center>
                                                                </div>
                                                                {/* ------Buyer ----------- */}
                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 buyerAgreement'>
                                                                            <h4 className='agreement-buyer'>Buyer</h4>
                                                                            <p>
                                                                                <small>
                                                                                    <strong style={{ color: "gray" }}>{(truncate(a.clientAdd))}</strong>
                                                                                </small>
                                                                            </p>
                                                                            <h6 className='agreement-buyer-stake'>Staked Amount</h6>
                                                                            <p>
                                                                                <small><strong style={{ color: "gray" }}>{(a.clientStake)} Eth</strong>
                                                                                </small></p>
                                                                            {
                                                                                a.completed ? <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Work Status : ✅</h6> : <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Work Status :  ❌</h6>
                                                                            }



                                                                            {a.release ? <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Fund release : ✅</h6> :
                                                                                <div className='row'>
                                                                                    <div className='col-6'>
                                                                                        <Button className="cancel-agreement-btn" variant="" onClick={() => cancel(a.agreeId)} > Cancel</Button>
                                                                                    </div>
                                                                                    <div className='col-6'>
                                                                                        <Button className="cancel-agreement-btn" variant="" onClick={() => fileDispute(a.agreeId)} > Dispute</Button>
                                                                                    </div>
                                                                                </div>
                                                                            }



                                                                            {
                                                                                a.completed && !a.release ? <Button className="providerstake-success-btn" variant=""
                                                                                    onClick={() => release(a.agreeId)}  >   Release Fund</Button> : ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* ------ Seller ----------- */}

                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 sellerAgreement'>
                                                                            <h4 className='agreement-buyer'>Seller</h4>
                                                                            <p><small><strong style={{ color: "gray" }}>{(truncate(a.providerAdd))}</strong></small></p><h6 className='agreement-buyer-stake'>Staked Amount</h6><p><small><strong style={{ color: "gray" }}>{(a.serviceProviderStake)} Eth</strong> </small></p>
                                                                            {a.completed ? <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Fund Received : {a.release ? <span >✅</span> : <span >❌</span>}</h6>
                                                                                : ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className='dispute-dividerr'></div>

                                                                {onlyArbitratorAccess(a)}

                                                                <center>{a.dispute ? setFundReceiver(a) : ""}</center>




                                                            </div>
                                                        </Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </div>
                                        )
                                    } else if (a.providerAdd === clientAddress && a.serviceProviderStake === 0) {
                                        return (
                                            <div style={{ width: "165%" }}>
                                                <Accordion>
                                                    <AccordionSummary
                                                        // expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content"
                                                        id="panel1a-header" >
                                                        <Typography style={{ width: "100%" }}>
                                                            <tbody>
                                                                <tr style={{ borderBottom: '1px solid #ddd' }} className="agreement-tablerow">
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreeId}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.title}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {(truncate(a.clientAdd))}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreementAmount / 1000000000000000000} Eth</td>
                                                                    <td className="transactions-table-cell transactions-table-cell--large transactions-table-cell--last transactions-table-cell@mobile--fullWidth">
                                                                        <div className="transactions-tags-container">
                                                                            <span
                                                                                onClick={() => stakeProviderEth(a.agreeId, a.agreementAmount)} className="transactions-tags-item transactions-tags-item--awaiting">{a.serviceProviderStake === 0 ? "• Awaiting Agreement" : "• Created Agreement"}</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography style={{ width: "100%" }}>
                                                            <div style={{ width: "61%" }} className='row'>
                                                                <div className='col-12'>
                                                                    <center><h5>Agreement {a.title}'s Details</h5></center>
                                                                    <center>

                                                                        <h6 className='agreement-buyer-stake'>Agreement Amount :<span>

                                                                            <small><strong style={{ color: "red" }}> {(a.agreementAmount) / 1000000000000000000} Eth</strong>
                                                                            </small></span>
                                                                        </h6>
                                                                        <div className='dividerr'></div>

                                                                    </center>

                                                                </div>

                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 buyerAgreement'>
                                                                            <h4 className='agreement-buyer'>Buyer</h4>
                                                                            <p><small><strong style={{ color: "gray" }}>{(truncate(a.clientAdd))}</strong>
                                                                            </small></p>

                                                                            <h6 className='agreement-buyer-stake'>Staked Amount</h6>

                                                                            <p><small><strong style={{ color: "gray" }}>{(a.clientStake)} Eth</strong>
                                                                            </small></p>


                                                                        </div>
                                                                    </div>
                                                                </div>


                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 sellerAgreement'>
                                                                            <h4 className='agreement-buyer'>Seller</h4>
                                                                            <p><small><strong style={{ color: "gray" }}>{(truncate(a.providerAdd))}</strong>
                                                                            </small></p>
                                                                            <h6 className='agreement-buyer-stake'>Staked Amount</h6>
                                                                            <p><small><strong style={{ color: "gray" }}>{(a.serviceProviderStake)} Eth</strong>
                                                                            </small></p>


                                                                            <Button className="providerstake-success-btn" variant=""
                                                                                onClick={() => stakeProviderEth(a.agreeId, a.agreementAmount)}
                                                                            >
                                                                                Stake
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </div>


                                        )
                                    } else if ((a.providerAdd === clientAddress && a.serviceProviderStake !== 0) || (a.arbitratorAdd === clientAddress && a.serviceProviderStake !== 0)) {
                                        return (
                                            <div style={{ width: "165%" }}>
                                                <Accordion>
                                                    <AccordionSummary
                                                        // expandIcon={<ExpandMoreIcon />}
                                                        aria-controls="panel1a-content"
                                                        id="panel1a-header"
                                                    >
                                                        <Typography style={{ width: "100%" }}>
                                                            <tbody>

                                                                <tr style={{ borderBottom: '1px solid #ddd' }} className="agreement-tablerow">
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreeId}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.title}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {(truncate(a.clientAdd))}
                                                                    </td>
                                                                    <td className="agreement-table-cell">
                                                                        {a.agreementAmount / 1000000000000000000} Eth
                                                                    </td>

                                                                    <td className="transactions-table-cell transactions-table-cell--large transactions-table-cell--last transactions-table-cell@mobile--fullWidth">
                                                                        <div className="transactions-tags-container">
                                                                            <span
                                                                                onClick={() => stakeProviderEth(a.agreeId, a.agreementAmount)}
                                                                                className="transactions-tags-item transactions-tags-item--awaiting">{a.serviceProviderStake === 0 ? "• Confirm Stake" : "• Created Agreement"}</span>
                                                                        </div>

                                                                    </td>
                                                                </tr>

                                                            </tbody>
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography style={{ width: "100%" }}>
                                                            <div style={{ width: "61%" }} className='row'>
                                                                <div className='col-12'>
                                                                    <center><h5>Agreement {a.title}'s Details</h5></center>
                                                                    <center>

                                                                        <h6 className='agreement-buyer-stake'>Agreement Amount :<span>

                                                                            <small><strong style={{ color: "red" }}> {(a.agreementAmount) / 1000000000000000000} Eth</strong>
                                                                            </small></span>
                                                                        </h6>
                                                                        <div className='dividerr'></div>

                                                                    </center>

                                                                </div>
                                                                {/* ----Buyer---- */}
                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 buyerAgreement'>
                                                                            <h4 className='agreement-buyer'>Buyer</h4>
                                                                            <p><small><strong style={{ color: "gray" }}>{(truncate(a.clientAdd))}</strong>
                                                                            </small></p>

                                                                            <h6 className='agreement-buyer-stake'>Staked Amount</h6>

                                                                            <p><small><strong style={{ color: "gray" }}>{(a.clientStake)} Eth</strong>
                                                                            </small></p>
                                                                            {a.release ? <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Fund release : ✅</h6> : ""}


                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/*------- Seler ---------  */}
                                                                <div className='col-6'>
                                                                    <div className='row agreement-detail-card'>
                                                                        <div className='col-12 sellerAgreement'>
                                                                            <h4 className='agreement-buyer'>Seller</h4>
                                                                            <p><small><strong style={{ color: "gray" }}>{(truncate(a.providerAdd))}</strong>
                                                                            </small></p>
                                                                            <h6 className='agreement-buyer-stake'>Staked Amount</h6>
                                                                            <p><small><strong style={{ color: "gray" }}>{(a.serviceProviderStake)} Eth</strong>
                                                                            </small></p>


                                                                            {
                                                                                a.completed ? <h6 style={{ marginBottom: "20px" }} className='agreement-buyer-stake'>Work Status : ✅</h6> :
                                                                                    <Button className="providerstake-success-btn" variant=""
                                                                                        onClick={() => workCompleted(a.agreeId)}
                                                                                    >
                                                                                        Submit Work
                                                                                    </Button>
                                                                            }

                                                                            {a.completed ? <h6 style={{ marginBottom: "20px", marginTop: "15px" }} className='agreement-buyer-stake'>Fund Received : {a.release ? <span >✅</span> : <span >❌</span>}</h6>
                                                                                : ""}

                                                                            {
                                                                                a.release ? "" : <Button className="cancel-agreement-btn" variant="" onClick={() => fileDispute(a.agreeId)} > Dispute</Button>
                                                                            }



                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className='dispute-dividerr'></div>

                                                                {onlyArbitratorAccess(a)}


                                                                <center>{a.dispute ? setFundReceiver(a) : ""}</center>


                                                            </div>
                                                        </Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </div>

                                        )
                                    }
                                }
                            })}
                        </table>
                    </div>
                </div>
            </div>
        )
    }



    return (
        <>
            <div>

                <div className="main">
                    <div style={{ textAlign: "center" }}>

                        <p><small>Client : <strong style={{ color: "gray" }}>{(truncate(clientAddress))}</strong>
                        </small></p>
                    </div>

                    <div className="createAgreement section--mid">
                        <div className="section-container section--small createAgreement-form--container ">

                            <form className="agreement-form">
                                <div >
                                    <div style={{ marginLeft: "11px" }} className="createAgreement-title">Create Agreement</div>
                                    <hr className="MuiDivider-root MuiDivider-fullWidth css-39bbo6"></hr>

                                    <div className="m-3">
                                        <TextField className="textfield" fullWidth label="Agreement Title" id="fullWidth" variant="standard"
                                            onChange={(e) => {
                                                setTitle(e.target.value)
                                            }} />
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
                                            <TextField style={{ marginTop: "-15px" }} className="textfield" fullWidth label="Amount" type="number" id="fullWidth" variant="standard"
                                                onChange={(e) => {
                                                    setAmount(e.target.value);
                                                    setFund((Number(e.target.value) * 2).toString());
                                                }} />
                                        </div>


                                    </div>

                                    <div style={{ overflow: "hidden" }} >
                                        <Typography className='note-class'>
                                            {amount > 0 ? <div><p>Note that you have to provide    <span style={{ color: "red", fontSize: "20px" }}>{fund}</span>  Eth to Stake</p></div> : ""}
                                        </Typography>
                                    </div>


                                    <div className="m-3">
                                        <TextField className="textfield" fullWidth label="Service Provider" id="fullWidth" variant="standard"

                                            onChange={(e) => {
                                                setServiceProviderAddress(e.target.value)
                                            }} />
                                    </div>

                                    <div className="m-3">
                                        <TextField className="textfield" fullWidth label="Arbitrator" id="fullWidth" variant="standard"

                                            onChange={(e) => {
                                                setArbotratorAddress(e.target.value)
                                            }} />
                                    </div>



                                    <div>
                                        <center>
                                            {loading ?
                                                <Button style={{ cursor: 'none' }} className="submit-success-btn-onclick" variant="contained"
                                                >
                                                    <CircularProgress style={{ color: 'white', }} />
                                                </Button> :
                                                <Button className="submit-success-btn" variant="contained"
                                                    onClick={createAgreement}
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



                    <div style={{ marginTop: "10px" }}>
                        <h1 className='myagreement-title' style={{ textAlign: 'center' }}>My Agreements </h1>
                        <div className='row'>



                            {/* {renderTabs()} */}
                            {renderAgreemetsTab()}


                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FreelanceEscrow;