export const fadeInAnimationVariants = {
    initial: ({ xValue }: { xValue: number })=>({
        opacity:0,
        x:xValue,
    }),
    animate: ({ delayValue }: { delayValue: number })=>({
        opacity:1,
        x:0,
        transition: {
            duration: 1,
            delay: delayValue,
        },
    }),
}