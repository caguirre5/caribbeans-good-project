import React from 'react';

const CallbackForm: React.FC = () => {
    return (
        <div className="py-10 px-8 lg:px-20 bg-[#9ed1c4] w-[90%] lg:w-[40%] m-auto my-8 lg:my-14 rounded-md">
            <h2 className="text-5xl font-bold text-[#044421] mb-4" style={{fontFamily:'KingsThing'}}>Call-Back Form</h2>
            <p className="text-[#044421] mb-4 text-sm">
                We’d love to hear from you and get into the specifics, We will email or call, depending on your preference, answering any questions you have. Fill out this form and we will contact you as soon as we can.
            </p>
            <p className="text-[#044421] mb-6 text-sm">
                *Please note this is not the form for access to the roasters portal, <a href="#" className="text-[#044421] underline">click here for Sign-up form.</a>
            </p>
            <form>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">First name</label>
                    <input type="text" placeholder="First name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Last name</label>
                    <input type="text" placeholder="Last name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <input type="email" placeholder="Email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Phone</label>
                    <input type="tel" placeholder="Phone" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Company Name *</label>
                    <input type="text" placeholder="Company" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Business Address *</label>
                    <input type="text" placeholder="Select an Address" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Where did you hear about us?</label>
                    <input type="text" placeholder="How did you hear about us?" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">How much coffee are you looking for?</label>
                    <input type="text" placeholder="Amount of coffee" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">How would you like us to contact you? *</label>
                    <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <label className="text-sm text-gray-700">E-mail</label>
                    </div>
                    <div className="flex items-center mt-2">
                        <input type="checkbox" className="mr-2" />
                        <label className="text-sm text-gray-700">Phone Call</label>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Captcha</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <div className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <label className="text-sm text-gray-700">I'm not a robot</label>
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500">Send</button>
            </form>
        </div>
    );
};

export default CallbackForm;
