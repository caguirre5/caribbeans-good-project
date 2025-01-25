/**
 * Generates a random border-radius value with each percentage being at least 20%.
 * @returns {string} A string representing a CSS border-radius value with random percentages between 20 and 100.
 */
export const generateRandomBorderRadius = (): string => {
    const randomValue = () => Math.floor(Math.random() * 80) + 20; // Generate values between 20 and 100
    return `${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}% / ${randomValue()}% ${randomValue()}% ${randomValue()}% ${randomValue()}%`;
};

export const parseTextFile = async (file: string): Promise<React.ReactNode[]> => {
    const response = await fetch(file);
    const text = await response.text();
    const lines = text.split('\n').map((line, index) => {
        if (line.startsWith('###')) {
            return (
                <p
                    key={index}
                    className="text-sm text-justify leading-6"
                    style={{
                        position: 'relative',
                        paddingLeft: '1em', // Espaciado para el texto
                        marginLeft: '-1em', // Viñeta sale fuera del margen
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            left: '-1em', // Ubica la viñeta fuera del margen
                            color: '#044421', // Color verde para destacar
                            fontSize: '1em', // Aumenta el tamaño del bullet point
                            fontWeight: 'bold', // Hace el punto más grueso
                            lineHeight: '1.5', // Asegura que no se mueva verticalmente
                        }}
                    >
                        ◆
                    </span>
                    {line.substring(3).trim()}
                </p>
            );
        } else if (line.startsWith('#&&')) {
            return (
                <p
                    key={index}
                    className="text-sm text-justify leading-6"
                    style={{
                        position: 'relative',
                        paddingLeft: '3em', // Más sangría para los sub-subbullets
                        marginLeft: '2em', // Viñeta aún más a la derecha
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            left: '1.5em', // Ubica la viñeta más a la derecha
                            color: '#044421', // Color verde para la viñeta
                            fontSize: '1em', // Tamaño de viñeta más pequeño
                            fontWeight: 'bold', // Hace la viñeta más gruesa
                            lineHeight: '1.4', // Asegura alineación vertical
                        }}
                    >
                        ○
                    </span>
                    {line.substring(3).trim()}
                </p>
            );
        } else if (line.startsWith('#&')) {
            return (
                <p
                    key={index}
                    className="text-sm text-justify leading-6"
                    style={{
                        position: 'relative',
                        paddingLeft: '2em', // Más sangría para los subbullets
                        marginLeft: '1em', // Viñeta más a la derecha
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            left: '0.5em', // Ubica la viñeta más a la derecha
                            color: '#044421', // Color verde para la viñeta
                            fontSize: '1.5em', // Tamaño de viñeta más pequeño
                            fontWeight: 'bold', // Hace la viñeta más gruesa
                            lineHeight: '1.2', // Asegura alineación vertical
                        }}
                    >
                        •
                    </span>
                    {line.substring(2).trim()}
                </p>
            );
        } else if (line.startsWith('##')) {
            return (
                <h2
                    key={index}
                    className="text-2xl font-semibold mb-4 mt-6 relative"
                    style={{ fontFamily: 'KingsThing' }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            left: '-2em', // Ubica la flecha al inicio del margen
                            color: '#044421', // Color verde para la flecha
                            fontSize: '0.8em', // Tamaño de la flecha
                            fontWeight: 'bold', // Hace la flecha más gruesa
                            lineHeight: '1.7', // Asegura alineación vertical
                        }}
                    >
                        ➤
                    </span>
                    {line.substring(2).trim()}
                </h2>
            );
        } else if (line.startsWith('#')) {
            return (
                <h1 key={index} className="text-4xl font-bold mb-4 mt-8 text-center">
                    {line.substring(1).trim()}
                </h1>
            );
        } else {
            return (
                <p key={index} className="text-sm text-justify leading-6">
                    {line.trim()}
                </p>
            );
        }
    });

    return lines;
};
