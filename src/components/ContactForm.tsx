function ContactForm() {
    return (
        <div className=" w-full h-full flex flex-col items-center justify-center ">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Contact Us</h2>
            <form className="">
            <div className="flex flex-col lg:flex-row gap-5">
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="firstName">
                        First Name
                    </label>
                    <input
                        className=" rounded-full px-4 py-2 focus:outline-none focus:ring-0"
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        type="text"
                    />
                </div>
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lastName">
                        Last Name
                    </label>
                    <input
                        className=" rounded-full px-4 py-2 focus:outline-none focus:ring-0"
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        type="text"
                    />
                </div>
            </div>
            <div className="my-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                Email
                </label>
                <input
                className=" block w-full px-4 py-2 rounded-full border-gray-300 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
                id="email"
                name="email"
                placeholder="john@example.com"
                type="email"
                />
            </div>
            <div className="my-2">
                <label className="block text-sm font-medium  text-gray-700 dark:text-gray-300" htmlFor="message">
                Message
                </label>
                <textarea
                className="block w-full px-4 py-2 rounded-2xl border-gray-300 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
                id="message"
                name="message"
                placeholder="Your message..."
                rows={4}
                />
            </div>
            <button
                className="mt-2 rounded-full bg-[#c9d3c0] py-2 px-12 text-sm font-medium text-white shadow-sm transition duration-300 ease-in-out hover:bg-[#9ed1c4] hover:text-[#044421] focus:outline-none focus:ring-0 focus:ring-indigo-500 focus:ring-offset-2"
                type="submit"
            >
                Send 
            </button>
            </form>
        </div>
    )
}

export default ContactForm