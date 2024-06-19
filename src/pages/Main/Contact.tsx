import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"
import ContactForm from "../../components/ContactForm"
import SocialMedia from "../../components/SocialMedia"
import LeafletMapComponent from "../../components/LeafletMapComponent"

function Contact() {
    return (
        <div className="overflow-x-hidden">
            <Header/>
            {/* Welcoming Text */}
            <div className="mt-20">
                <div className="flex flex-col items-center justify-evenly py-8" style={{height:'40 vh'}}>
                    <p className="text-base text-[#779da0]" >Let's Connect</p>
                    <h2 className="text-6xl text-[#044421]" style={{fontFamily: 'KingsThing'}}>Contact</h2>
                    <p className="w-4/5  text-center lg:w-2/5" >Contact us for details or questions. Our team is committed to exceptional support and is happy to assist in any way.</p>
                </div>
                {/* Form */}
                <div className="bg-[#c9d3c0] flex flex-col lg:flex-row h-auto lg:h-[70vh]" style={{}}>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 py-10 text-[#044421]">
                        <div className="flex flex-col justify-center items-center">
                            {/* icon    */}
                            <h3 className="text-xl font-bold">Address</h3>
                            <p>Strathclyde Inspire<br/>50 Richmond Street.<br/>Glasgow. G1 1XQ</p>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <h3 className="text-xl font-bold">Phone</h3>
                            <p>GT: (+502) 41756946<br/>UK (+44) 7413981290</p>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <h3 className="text-xl font-bold">Email</h3>
                            <p>info@caribbeangoods.co.uk</p>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <h3 className="text-xl font-bold">Social Media</h3>
                            <SocialMedia 
                                instagramLink="https://www.instagram.com/caribbeangoods/" 
                                facebookLink="https://www.facebook.com/caribbeangoodsuk/posts/2171011849881565/"
                                linkedinLink="https://www.linkedin.com/company/caribbean-goods-ltd/?originalSubdomain=uk"
                            />
                        </div>
                    </div>
                    <div className="flex-1 bg-[#628f76] flex justify-center items-center">
                        <ContactForm/>
                    </div>
                </div>
                    <LeafletMapComponent coordinates={[55.860910, -4.241640]} center={[55.860910, -4.241640]} popupDescription="Caribbean Goods" zoom={15}/>
                <div>

                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default Contact