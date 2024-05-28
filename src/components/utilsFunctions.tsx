/**
 * Generates a random border-radius value with each percentage being at least 20%.
 * @returns {string} A string representing a CSS border-radius value with random percentages between 20 and 100.
 */
export const generateRandomBorderRadius = (): string => {
    const randomValue = () => Math.floor(Math.random() * 80) + 20; // Generate values between 20 and 100
    return `${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}% / ${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}%`;
}
