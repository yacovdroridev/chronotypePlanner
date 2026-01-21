import { useEffect } from 'react';
import appMarkup from './appMarkup';
import { initApp } from './appLogic';


function App() {
  useEffect(() => {
    initApp();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: appMarkup }} />;
}

export default App;
