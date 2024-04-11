import { useState, ChangeEvent } from 'react';
import './FormStyles.css'

function ClientsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areYou, setAreYou] = useState('');
  const [otherAreYou, setOtherAreYou] = useState('');
  const [company, setCompany] = useState('');
  const [mailingList, setMailingList] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [howDidYouHear, setHowDidYouHear] = useState<string[]>([]);

  const handleHowDidYouHearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setHowDidYouHear([...howDidYouHear, value]);
    } else {
      setHowDidYouHear(howDidYouHear.filter(item => item !== value));
    }
  };

  return (


    <div className="w-full h-screen bg-[#044421]">
    <div className=" bg-[#FAFAFA] p-8 border rounded-md shadow-md form-container">
      <h2 className="text-2xl mb-4">Clients Form</h2>
      <div className="mb-4">
        <label className="block  mb-2">Name:</label>
        <input
          type="text"
          className="w-full border p-2 rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Email:</label>
        <input
          type="text"
          className="w-full border p-2 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Phone Number:</label>
        <input
          type="text"
          className="w-full border p-2 rounded-md"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Are you a:</label>
        <div className="flex flex-col mb-2 ">
            <div>
              <input
                type="radio"
                id="coffeeProfessional"
                value="Coffee Professional"
                checked={areYou === 'Coffee Professional'}
                onChange={(e) => setAreYou(e.target.value)}
                className="mr-2"
              />
              <label htmlFor="coffeeProfessional" className="mr-4">Coffee Professional (Barista, Roaster, etc.)</label>
            </div>
            <div>
              <input
                type="radio"
                id="vendorExhibitor"
                value="Vendor/Exhibitor"
                checked={areYou === 'Vendor/Exhibitor'}
                onChange={(e) => setAreYou(e.target.value)}
                className="mr-2"
              />
              <label htmlFor="vendorExhibitor" className="mr-4">Vendor/Exhibitor</label>
            </div>
            <div>
              <input
                type="radio"
                id="coffeeEnthusiast"
                value="Coffee Enthusiast/Attendee"
                checked={areYou === 'Coffee Enthusiast/Attendee'}
                onChange={(e) => setAreYou(e.target.value)}
                className="mr-2"
              />
              <label htmlFor="coffeeEnthusiast">Coffee Enthusiast/Attendee</label>
            </div>
          <div>
            <input
              type="radio"
              id="other"
              value="Other"
              checked={areYou === 'Other'}
              onChange={(e) => setAreYou(e.target.value)}
              className="mr-2"
            />
            <label htmlFor="other">Other</label>
          </div>
        </div>
        {areYou === 'Other' && (
          <input
            type="text"
            placeholder="Please specify"
            className="w-full border p-2 rounded-md"
            value={otherAreYou}
            onChange={(e) => setOtherAreYou(e.target.value)}
          />
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-2">Which company do you work for?</label>
        <input
          type="text"
          className="w-full border p-2 rounded-md"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={mailingList}
            onChange={(e) => setMailingList(e.target.checked)}
          />
          Would you like to sign up for our mailing list to receive updates on future products that match your profile?
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-2">How did you hear about us?</label>
        <div className="flex flex-wrap">
          <label className="mr-4">
            <input
              type="checkbox"
              value="Social Media"
              checked={howDidYouHear.includes('Social Media')}
              onChange={handleHowDidYouHearChange}
              className="mr-2"
            />
            Social Media
          </label>
          <label className="mr-4">
            <input
              type="checkbox"
              value="Friend or Colleague"
              checked={howDidYouHear.includes('Friend or Colleague')}
              onChange={handleHowDidYouHearChange}
              className="mr-2"
            />
            Friend or Colleague
          </label>
          <label className="mr-4">
            <input
              type="checkbox"
              value="Online Advertising"
              checked={howDidYouHear.includes('Online Advertising')}
              onChange={handleHowDidYouHearChange}
              className="mr-2"
            />
            Online Advertising
          </label>
          <label className="mr-4">
            <input
              type="checkbox"
              value="Print Media"
              checked={howDidYouHear.includes('Print Media')}
              onChange={handleHowDidYouHearChange}
              className="mr-2"
            />
            Print Media
          </label>
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Feedback or Suggestions:</label>
        <textarea
          className="w-full border p-2 rounded-md"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>
      </div>
    </div>
    </div>
    
  );
}

export default ClientsForm;
