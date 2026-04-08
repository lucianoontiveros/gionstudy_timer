import React, { useEffect, useState, memo } from 'react';
import './news.css';

const News = memo(({ message }) => {
    const [displayedMessage, setDisplayedMessage] = useState('');

    useEffect(() => {
        if (message) {
            setDisplayedMessage(''); // Clear previous message
            const typeWriterEffect = (text, i) => {
                if (i < text.length) {
                    setDisplayedMessage(prev => prev + text.charAt(i));
                    setTimeout(() => typeWriterEffect(text, i + 1), 50);
                }
            };
            typeWriterEffect(message, 0);
        }
    }, [message]);

    const formattedMessage = displayedMessage.charAt(0).toUpperCase() + displayedMessage.slice(1) ;

    return (
        displayedMessage ? (
            <div className='message-container'>
                <div className='message'>{formattedMessage}<span class="blinking">&lt;|</span></div>
            </div>
        ) : null
    );
});

export default News;