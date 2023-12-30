import './Footer.css'

function Footer() {
    return (
        <div className="footer-container">
            <div className='info-container'>
                <div className='scotland'>
                    <h3>scotland</h3>
                    <p>Strathclyde Inspire 50 Richmond Street Glasgow. G1 1XP</p>
                </div>
                <div className='contact'>
                    <h3>Contact</h3>
                    <p>info@caribbeangoiods.co.uk</p>
                    <p>GT: (+502) 41756946</p>
                    <p>UK (+44) 7413981290</p>
                </div>
                <div className='subscribe'>
                    <h3>Subscribe</h3>
                    <div className='subscription-box'></div>
                </div>
                <div className='guatemala'>
                    <h3>Guatemala</h3>
                    <p>Km 22.1 Carretera al Salvador. Eco Plaza. Bodega 315. Guatemala. 01062</p>
                </div>
                <div className='social'>
                    <div className='icon-container'>
                        <div className='icon'></div>
                        <div className='icon'></div>
                        <div className='icon'></div>
                        <div className='icon'></div>
                    </div>
                    <p>©2023CaribbeanGoodsLtd</p>
                    <div className='text-container'>
                        <p>Privacy Policy</p>
                        <p>Terms Of Use</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer