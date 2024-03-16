import './CoffeeProcess.css'

// GIFS
import gif1 from '../../assets/GIFS/Grow.an.gif'
import gif2 from '../../assets/GIFS/Wetmill.ani.gif'
import gif3 from '../../assets/GIFS/DRYMILL.an.gif'
import gif4 from '../../assets/GIFS/Export ani.gif'

//Mural Arts
import Art1 from '../../assets/ICE/CoffeeProcessMural/Artboard1.png'
import Art2 from '../../assets/ICE/CoffeeProcessMural/Artboard2.png'
import Art3 from '../../assets/ICE/CoffeeProcessMural/Artboard3.png'
import Art4 from '../../assets/ICE/CoffeeProcessMural/Artboard4.png'
import Art5 from '../../assets/ICE/CoffeeProcessMural/Artboard5.png'
import Art6 from '../../assets/ICE/CoffeeProcessMural/Artboard6.png'
import Art7 from '../../assets/ICE/CoffeeProcessMural/Artboard7.png'
import Art8 from '../../assets/ICE/CoffeeProcessMural/Artboard8.png'
import Art9 from '../../assets/ICE/CoffeeProcessMural/Artboard9.png'
import Art10 from '../../assets/ICE/CoffeeProcessMural/Artboard10.png'
import Art11 from '../../assets/ICE/CoffeeProcessMural/Artboard11.png'
import Art12 from '../../assets/ICE/CoffeeProcessMural/Artboard12.png'
import Art13 from '../../assets/ICE/CoffeeProcessMural/Artboard13.png'
import Art14 from '../../assets/ICE/CoffeeProcessMural/Artboard14.png'
import Art15 from '../../assets/ICE/CoffeeProcessMural/Artboard15.png'
import Art16 from '../../assets/ICE/CoffeeProcessMural/Artboard16.png'
import Art17 from '../../assets/ICE/CoffeeProcessMural/Artboard17.png'
import Art18 from '../../assets/ICE/CoffeeProcessMural/Artboard18.png'
import Art19 from '../../assets/ICE/CoffeeProcessMural/Artboard19.png'
import Art20 from '../../assets/ICE/CoffeeProcessMural/Artboard20.png'
import Art21 from '../../assets/ICE/CoffeeProcessMural/Artboard21.png'
import Art22 from '../../assets/ICE/CoffeeProcessMural/Artboard22.png'
import Art23 from '../../assets/ICE/CoffeeProcessMural/Artboard23.png'

//Taste Wheel
import TasteWheelImg from '../../assets/ICE/Tastewheel.png'

import { BouncingDiv, InfiniteRotation, PushDiv, SlideDiv } from '../../components/Animations'

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
            <div className='mural'>
                <div className='mural-item LMural'>
                    <img src={Art1} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art2} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art3} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art4} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art5} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art6} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art7} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art8} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art9} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art10} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art11} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art12} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art13} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art14} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art15} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art16} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art17} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art18} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art19} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art20} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art21} alt="" />
                </div>
                <div className='mural-item RMural'>
                    <img src={Art22} alt="" />
                </div>
                <div className='mural-item LMural'>
                    <img src={Art23} alt="" />
                </div>
            </div>
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