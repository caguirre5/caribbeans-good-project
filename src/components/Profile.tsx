import Header from "./HeaderControls";
import Footer from "./Footer";
import { useAuth0 } from "@auth0/auth0-react";

const Profile: React.FC = () => {
    const {user, logout} = useAuth0();
    return (
        <div>
            <Header/>
            <div className="max-w-4xl mx-auto p-4 mt-20">
                <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display name *</label>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        defaultValue={user?.name}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                    </div>
                    <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                    </div>
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Profile image</label>
                    <div className="mt-2 flex items-center">
                        <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        <img src={user?.picture} alt="Profile" />
                        </span>
                        <button
                        type="button"
                        className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                        Update
                        </button>
                    </div>
                    </div>
                    <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900">Personal info</h3>
                    <p className="mt-1 text-sm text-gray-600">Update your personal information.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mt-4">
                    <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                        <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        defaultValue={user?.name}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        readOnly
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                        <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        defaultValue="Aguirre"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        readOnly
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                        <input
                        type="text"
                        id="company"
                        name="company"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                        type="text"
                        id="phone"
                        name="phone"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">Company website</label>
                        <input
                        type="text"
                        id="companyWebsite"
                        name="companyWebsite"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                        <input
                        type="text"
                        id="position"
                        name="position"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        className="bg-gray-300 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                        onClick={()=>logout()}
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Update Info
                    </button>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default Profile;
