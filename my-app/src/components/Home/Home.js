import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaAdn,  FaBitcoin, FaChrome} from "react-icons/fa";


// import '../homi/home.css';
function HomeCategory() {
    return (

        <>
            {/* <div>

              

                <div className="grid-container container">
                    <div style={{ justifyContent: "space-evenly" }} className='row'>
                        <div className="grid-item  col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    
                                    <p className='icon-name'> Escrow 1</p>

                                </div>

                            </div>
                        </div>

                        <div className="grid-item col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    <p className='icon-name'>Escrow 2</p>

                                </div>
                            </div>
                        </div>
                        <div className="grid-item col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    <p className='icon-name'>Escrow 3</p>

                                </div>
                            </div>
                        </div>
                        <div className="grid-item col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    <p className='icon-name'>Escrow 4</p>

                                </div>
                            </div>
                        </div><div className="grid-item col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    <p className='icon-name'>Escrow 5</p>

                                </div>
                            </div>
                        </div><div className="grid-item col-4" >

                            <div className='cardsfeture' >
                                <div className="buttons" >
                                    <a className="" href="">

                                    </a>
                                    <p className='icon-name'>Escrow 6</p>

                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div> */}
            <div class="container">
                <main class="grid">
                    <article className="forbg1">


                        <h1 className="fonticon"> <FaAdn /></h1>
                        <div class="text">
                            <h3>Escrow 1</h3>


                        </div>
                    </article>

                    <article  className="forbg2" >
                        <h1 className="fonticon"> <FaBitcoin className="icon2" /></h1>
                        <div class="text">
                            <h3>Escrow 2</h3>
                        </div>
                    </article>
                    <article  className="forbg3">
                        <h1 className="fonticon"> <FaChrome /></h1>
                        <div class="text">
                            <h3>Escrow 3</h3>
                        </div>
                    </article>
                    <article  className="forbg4">
                        <h1 className="fonticon"> <FaAdn /></h1>
                        <div class="text">
                            <h3>Escrow 4</h3>
                        </div>
                    </article>
                    <article  className="forbg5">
                        <h1 className="fonticon"> <FaAdn /></h1>
                        <div class="text">
                            <h3>Escrow 5</h3>
                        </div>
                    </article>
                    <article  className="forbg6">
                        <h1 className="fonticon"> <FaAdn /></h1>
                        <div class="text">
                            <h3>Escrow 6</h3>
                        </div>
                    </article>

                </main>
            </div>






        </>
    )
}

export default HomeCategory;