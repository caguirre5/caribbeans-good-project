import './Footer.css'
import SocialMedia from './SocialMedia';

function Footer() {
    return (
        <div className="footer-container py-10" style={{ fontFamily:'PoppinsLight'}}>
            <div className='info-container'>
                <div className=''>
                    <h3 className="mb-8 uppercase text-xl tracking-[.30em] text-[#9da793]">Scotland</h3>
                    <p className='text-[0.95rem]'>Strathclyde Inspire <br/>50 Richmond Street <br/>Glasgow. G1 1XP</p>
                </div>
                <div className='contact'>
                    <h3 className="mb-8 uppercase text-xl tracking-[.30em] text-[#9da793]">Contact</h3>
                    <p className='text-[0.95rem]'>
                        info@caribbeangoiods.co.uk
                        <br/>
                        GT: (+502) 41756946
                        <br/>
                        UK (+44) 7413981290
                        </p>
                </div>
                <div className='subscribe'>
                    <h3 className="mb-8 uppercase text-xl tracking-[.30em] text-[#9da793]">Subscribe</h3>
                    <p className='text-xs'>Get the latest news & updates. <br/>Subscribe to our newsletter.</p>
                    <div className='subscription-box'>
                    <form className="flex flex-col items-center">
                        <input
                            type="email"
                            placeholder="Your email address here**"
                            className=" w-full p-2 px-4 my-2 text-green-900 placeholder-green-900 placeholder:text-xs placeholder:font-bold bg-[#e6a318] rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            required
                        />
                        <button
                            type="submit"
                            className="self-end bg-[#eecc84] py-1 hover:bg-yellow-600 text-green-900 text-xs font-bold px-4 rounded-full transition duration-200"
                        >
                            Subscribe
                        </button>
                    </form>
                    </div>
                </div>
                <div className='guatemala'>
                    <h3 className="mb-8 uppercase text-xl tracking-[.30em] text-[#9da793]">Guatemala</h3>
                    <p className='text-[0.95rem]'>Km 22.1 Carretera al Salvador. <br/>Eco Plaza. Bodega 315. <br/>Guatemala. 01062</p>
                </div>
                <div className='flex flex-col justify-center'>
                    <SocialMedia 
                        instagramLink="https://www.instagram.com/caribbeangoods/" 
                        facebookLink="https://www.facebook.com/caribbeangoodsuk/posts/2171011849881565/"
                        linkedinLink="https://www.linkedin.com/company/caribbean-goods-ltd/?originalSubdomain=uk"
                        youtubeLink='https://youtube.com/@caribbeangoods8639?si=WLCgWVMCgnGvsFZq'
                    />
                    <p className='mt-4 text-[0.95rem]'>©2023CaribbeanGoodsLtd</p>
                </div>
                <div className='flex flex-col p-0 w-full text-[0.95rem]'>
                    <a href='/Legal/PrivacyPolicy' className='my-2 underline'>Privacy Policy</a>
                    <a href='/Legal/IPTerms' className='my-2 underline'>IP Terms and Conditions</a>
                    <a href='/Legal/SalesTerms' className='my-2 underline'>Sales Terms and Free Shipping</a>
                </div>
            </div>
        </div>
    )
}

export default Footer