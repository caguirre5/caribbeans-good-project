import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";

import Image from "../../assets/Images/All/EFR06137.jpg"

const Subscribe: React.FC = () => {

    return(
        <div>
            <Header/>
            <div 
                className="pt-20 lg:mt-20 lg:pt-24 flex-col flex lg:flex-row items-center justify-center overflow-hidden"
                style={{ height: 'calc(100vh - 5rem)' }}
            >
                <div className="lg:flex-1 flex items-center justify-center ">
                    <img src={Image} alt="" className="w-screen h-[200px] lg:h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col lg:w-[40%] items-center justify-center p-6  text-center ">
                    <h2 className="text-2xl font-bold text-green-800 mb-4">Join our mailing list</h2>
                    <p className="text-gray-700 mb-6 lg:w-[80%]">
                        Sign up below to get a monthly update on what's going on with our farmers with news and updates on our products too.
                    </p>
                    <div className="w-full max-w-sm mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Updates</h3>
                        <p className="text-gray-600 mb-4">
                            Get the latest news & updates. Subscribe to our newsletter.
                        </p>
                        <div className="flex flex-col md:flex-row gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email here*"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button
                                type="button"
                                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
}
export default Subscribe


