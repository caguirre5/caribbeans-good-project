/**
 * Generates a random border-radius value with each percentage being at least 20%.
 * @returns {string} A string representing a CSS border-radius value with random percentages between 20 and 100.
 */
export const generateRandomBorderRadius = (): string => {
    const randomValue = () => Math.floor(Math.random() * 80) + 20; // Generate values between 20 and 100
    return `${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}% / ${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}%`;
}


interface Line {
    type: 'title' | 'paragraph';
    text: string;
}

export const parseTextFile = async (file: string): Promise<React.ReactNode[]> => {
    const response = await fetch(file);
    const text = await response.text();
    const lines: Line[] = text.split('\n').map((line): Line => {
        if (line.startsWith('#')) {
        return { type: 'title', text: line.substring(1).trim() };
        } else {
        return { type: 'paragraph', text: line.trim() };
        }
    });

    return lines.map((item, index) => {
        if (item.type === 'title') {
        return <h2 key={index} className="text-5xl text-center font-bold my-12" style={{fontFamily:'KingsThing'}}>{item.text}</h2>;
        } else {
        return <p key={index} className="text-sm text-justify">{item.text}</p>;
        }
    });
};
  
