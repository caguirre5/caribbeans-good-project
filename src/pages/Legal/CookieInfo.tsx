import React from 'react';

const CookiesInfo: React.FC = () => {
  return (
        <div className='flex flex-col justify-center px-10 py-4 text-[#044421]'>
            <h1 className="text-3xl font-bold mb-4">Cookies</h1>
            <p className="mb-4">
                Cookies are small files saved on your phone, tablet or computer when you visit a website.
            </p>
            <p className="mb-4">
                We use cookies to make this site work and collect information about how you use our service.
            </p>

            <h2 className="text-2xl font-semibold mb-2">Essential cookies</h2>
            <p className="mb-4">
                Essential cookies keep your information secure while you use this service. We do not need to ask permission to use them.
            </p>

            <table className="w-full mb-6 border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Purpose</th>
                    <th className="text-left p-2 font-semibold">Expires</th>
                </tr>
                </thead>
                <tbody>
                <tr className="border-b">
                    <td className="p-2">session_cookie</td>
                    <td className="p-2">Used to keep you signed in</td>
                    <td className="p-2">20 hours</td>
                </tr>
                <tr>
                    <td className="p-2">cookie_policy</td>
                    <td className="p-2">Saves your cookie consent settings</td>
                    <td className="p-2">1 year</td>
                </tr>
                </tbody>
            </table>

            <h2 className="text-2xl font-semibold mb-2">Analytics cookies</h2>
            <p className="mb-4">
                With your permission, we use Google Analytics to collect data about how you use this service. This information helps us to improve our service.
            </p>
            <p className="mb-4">
                Google is not allowed to use or share our analytics data with anyone.
            </p>
            <p className="mb-4">
                Google Analytics stores anonymised information about:
            </p>
        </div>
  );
};

export default CookiesInfo;
