import './CoffeeProcess.css'

// GIFS
import gif1 from '../../assets/GIFS/Grow.an.gif'
import gif2 from '../../assets/GIFS/Wetmill.ani.gif'
import gif3 from '../../assets/GIFS/DRYMILL.an.gif'
import gif4 from '../../assets/GIFS/Export ani.gif'

//Taste Wheel
import TasteWheelImg from '../../assets/ICE/Tastewheel.png'

import { BouncingDiv, InfiniteRotation, PushDiv, RotatorDiv, SlideDiv } from '../../components/Animations'

function CoffeeProcess() {
    return (
        <div className='page-container-cp'>
            <div className='landing-container'>
                <div className='title-container'>
                    <p>process</p>
                </div>
                <div className='intro-text'>
                    <p>From skilled farmers to meticulous roasting specifications, coffee beans go through an amazing journey that brings out their unique flavors. It's a fascinating process that involves many different people and places, and one that we are excited to share with you.</p>
                    <p>let us take you on a journey through the world of coffee!</p>
                </div>
            </div>
            
            <PushDiv className='grid-layout-container gl1'>
                <BouncingDiv className=''>

                <p>Guatemala has up to 300 microclimates, each offering unique growing conditions that affect crop development.</p>
                </BouncingDiv>
            </PushDiv>
            <BouncingDiv className='grid-layout-container gl2'>
                <p>Coffee was first introduced to Guatemala in the mid-1700s, but it was not until 1860 that production seriously took off. Prior to that, the plant was only used for ornamental purposes. As the carmine dye industry began to decline, which was the biggest industry in Guatemala at that point, the government searched for new industries to improve the economy.</p>
            </BouncingDiv>
            <div className='gif gif1'>
                <img src={gif1} alt="" />
                <SlideDiv className='' variantSide={false}>
                    <p>Coffee is harvested once or twice a year, depending on whether it is sun-grown or shade-grown. Guatemala grows coffee under natural shade, using either native species or specific trees. As a result, Guatemala only harvests coffee once a year, making every crop precious to the farmers and their families.</p>
                </SlideDiv>
            </div>
            <div className='gif gif2'>
                <SlideDiv className='' variantSide={true}>
                    <p>When it comes to processing coffee, farmers have a few different options to choose from. Each of these processes can yield unique flavors, so it's important for farmers to carefully consider which one they want to use. One popular option is the washed process, which involves pulping the coffee cherries, washing them, and then drying them. Another option is the honey process, which involves pulping the cherries but skipping the washing step. Finally, there's the natural process, in which the cherries are simply dried without any processing. While each of these methods has its own pros and cons, ultimately it's up to the farmer to decide which one will produce the best coffee for their needs.</p>
                </SlideDiv>
                <img src={gif2} alt="" />
            </div>
            <div className='gif gif3'>
                <img src={gif3} alt="" />
                <SlideDiv className='' variantSide={false}>
                    <p>During the Dry Mill process, coffee beans undergo several steps:</p>
                    <ul>
                        <li>A magnet is used to remove any metal or foreign objects.</li>
                        <li>A destoner is used to get rid of rocks.</li>
                        <li>The beans are then polished to remove an outer layer called parchment.</li>
                        <li>The coffee beans are graded based on size, weight, and color.</li>
                        <li>The last step in the dry mill is a hand-picking process to check for defects and imperfections.</li>
                    </ul>
                </SlideDiv>
            </div>
            <div className='gif gif4'>
                <SlideDiv className='' variantSide={true}>
                <p>Farmers send their prepared coffees to a unit of our choosing. We do all the paperwork to export them out of Guatemala and import them to the UK. We then store them in the UK and distribute them to local coffee roasters.</p>
                </SlideDiv>
                <img src={gif4} alt="" />
            </div>
            <div className='taste-wheel-section shapedividers_com-8743 '>
                <BouncingDiv className=''>
                <h1>Taste wheel</h1>
                </BouncingDiv>
                <InfiniteRotation className=''>
                <img src={TasteWheelImg} alt="" />
                </InfiniteRotation>
            </div>
        </div>
    )
}

export default CoffeeProcess