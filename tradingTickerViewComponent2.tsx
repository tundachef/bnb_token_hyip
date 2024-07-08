import React, { useEffect } from 'react';

const TradingTickerViewComponent2: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { description: 'ETHUSDT', proName: 'BINANCE:ETHUSDT' },
        { description: 'SOLUSDT', proName: 'BINANCE:SOLUSDT' },
        { description: 'BNBUSDT', proName: 'BINANCE:BNBUSDT' },
        { description: 'XAUUSD', proName: 'PYTH:XAUUSD' },
        { description: 'WIFUSDT', proName: 'BINANCE:WIFUSDT' },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: 'adaptive',
      colorTheme: 'light',
      locale: 'en',
    });

    const widgetContainer = document.querySelector('.tradingview-widget-container__widgetx');
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }

    return () => {
      // Clean up the script when the component is unmounted
      if (widgetContainer) {
        widgetContainer.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container">
      <div className="tradingview-widget-container__widgetx"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Trade with ECash coin</span>
        </a>
      </div>
    </div>
  );
};

export default TradingTickerViewComponent2;