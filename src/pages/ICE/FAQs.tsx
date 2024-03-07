import './FAQs.css'
import React from 'react'
import { SlideDiv } from '../../components/Animations';

interface FAQUnitProps {
  title: string;
  text: string;
}

const FAQUnit: React.FC<FAQUnitProps> = ({ title, text }) => {
  return (
    <SlideDiv className='FAQItem' variantSide={false}>
      <h3>{title}</h3>
      <p>{text}</p>
    </SlideDiv>
  );
};

function TAQs() {


    return (
        <div className='FAQ-page-container'>
            <div className='header-section'>
                <div>
                    <h3>FAQs</h3>
                    <p>We want to make sure your experience with your VR headset is a smooth ride, in case you have any issues check out these FAQs to see if we have your question covered! if not send us a message on our chat and we will get back to you.</p>
                </div>
            </div>
            <div className='questions-section'>
                <FAQUnit title={'Title'} text = {'This is a Paragraph. Click on "Edit Text" or double click on the text box to start editing the content and make sure to add any relevant details or information that you want to share with your visitors.'}/>
                <FAQUnit title={'Title'} text = {'This is a Paragraph. Click on "Edit Text" or double click on the text box to start editing the content and make sure to add any relevant details or information that you want to share with your visitors.'}/>
                <FAQUnit title={'Title'} text = {'This is a Paragraph. Click on "Edit Text" or double click on the text box to start editing the content and make sure to add any relevant details or information that you want to share with your visitors.'}/>
            </div>
        </div>
    )
}

export default TAQs