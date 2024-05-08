import { useState, ChangeEvent } from 'react';
import './FormStyles.css'
import Logo from '../../assets/green_logo_icon.png'
import LogoLetter from '../../assets/logo_green_letter.png'

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

  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleHowDidYouHearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setHowDidYouHear([...howDidYouHear, value]);
    } else {
      setHowDidYouHear(howDidYouHear.filter(item => item !== value));
    }
  };

  const handleSubmit = () => {
    // Aquí puedes enviar los datos del formulario
    console.log('Formulario enviado');
    
    const databaseUrl = 'https://caribbean-goods-default-rtdb.europe-west1.firebasedatabase.app';
    const endpoint = `${databaseUrl}/Costumers.json`;

    // Construye el objeto de datos a enviar
    const formData = {
      name,
      email,
      phoneNumber,
      areYou,
      otherAreYou,
      company,
      mailingList,
      feedback,
      howDidYouHear
    };

    // Realiza una solicitud HTTP POST para enviar los datos a Firebase
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al enviar los datos a Firebase');
      }
      console.log('Datos enviados a Firebase');
      setFormSubmitted(true)
    })
    .catch(error => {
      console.error('Error:', error);
    });

    window.open('https://www.instagram.com/caribbeangoods?igsh=emRtcWJsdmp0YzRv', '_blank');
};

const handleRefresh = () => {
  window.location.reload();
};

  return (


    <div className="w-full h-screen bg-[#FAFAFA] flex justify-center items-center page-bg ">
      {/* #FBF5EC */}
      {!formSubmitted && (
        <div className=" drop-shadow-md flex h-4/5 bg-[#9ED1C4] border rounded-lg shadow-md form-container">
          {/* DIV 1 */}
          <div className='flex-1 flex flex-col  py-10 px-10 first-part-form'>
            <div className='flex-col justify-center hidden icon-logo-container'>
              <img src={Logo} alt="" className='h-40 self-center'/>
              <img src={LogoLetter} className='-mt-8 mb-8'/>
            </div>
            <img src={LogoLetter} alt="" className=' logo-letters'/>
            {/* <p className='my-5 text-justify'>We’d love to hear from you and get into the specifics, We will email or call,  answering any questions you have. Fill out this form and we will contact you as soon as we can.</p> */}
            <div className="mb-4 mt-8 input-container">
              <label className="block mb-2 font-extrabold">Name: *</label>
              <input
                type="text"
                className="w-full border p-2 "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-4 input-container">
              <label className="block mb-2 font-extrabold">Email: *</label>
              <input
                type="text"
                className="w-full border p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4 input-container">
              <label className="block mb-2 font-extrabold">Phone Number: *</label>
              <input
                type="text"
                className="w-full border p-2"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-extrabold">Are you a: *</label>
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
          </div>
          <div className=' h-4/5 self-center w-0.5 py-8 bg-black opacity-10 divider-bar'></div>
          {/* DIV 2 */}
          <div className='flex-1 flex flex-col justify-between py-14 px-10 second-part-form'>
            
            <div>
              <div className="mb-4">
                <label className="block mb-2 font-extrabold">Which company do you work for?</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded-md"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-extrabold">
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
                <label className="block mb-2 font-extrabold">How did you hear about us?</label>
                <div className="flex flex-wrap flex-col">
                  <div>
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
                  </div>
                  <div><label className="mr-4">
                    <input
                      type="checkbox"
                      value="Friend or Colleague"
                      checked={howDidYouHear.includes('Friend or Colleague')}
                      onChange={handleHowDidYouHearChange}
                      className="mr-2"
                    />
                    Friend or Colleague
                  </label>
                  </div>
                  <div><label className="mr-4">
                    <input
                      type="checkbox"
                      value="Online Advertising"
                      checked={howDidYouHear.includes('Online Advertising')}
                      onChange={handleHowDidYouHearChange}
                      className="mr-2"
                    />
                    Online Advertising
                  </label>
                  </div>
                  <div>
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
                  <div>
                    <label className="mr-4">
                      <input
                        type="checkbox"
                        value="Other"
                        checked={howDidYouHear.includes('Other')}
                        onChange={handleHowDidYouHearChange}
                        className="mr-2"
                      />
                      Other
                    </label>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-extrabold">Feedback or Suggestions:</label>
                <textarea
                  className="w-full border p-2 rounded-md"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className='flex items-center flex-col'>
              <button onClick={handleSubmit} className=" w-3/5 mt-4 bg-[#CD5231] text-white font-bold py-2 px-6 rounded-full">
                Send
              </button>
              <p className='text-center text-xs my-2 text-[#044421]'><a href='https://www.caribbeangoods.co.uk/privacy-policy' target="_blank">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      )}
      {formSubmitted && (
        <div className="p-8 drop-shadow-md flex h-4/5 bg-[#9ED1C4] border rounded-lg shadow-md form-container flex-col items-center justify-center">
          <p className="submittedForm">Your information has been successfully submitted!</p>
          <button onClick={handleRefresh} className="w-60 rounded-full mt-8 lg:mt-0 bg-[#FAFAFA] bg-opacity-30 px-4 py-2 text-white  hover:bg-[#044421] focus:outline-none focus:ring-2 focus:ring-gray-400 transition duration-300 ease-in-out">Continue</button>
        </div>
      )}
    </div>
    
  );
}

export default ClientsForm;
