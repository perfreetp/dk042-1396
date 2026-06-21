import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { SimulatorProvider } from './store/SimulatorContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] Initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] onShow');
  });

  useDidHide(() => {
    console.log('[App] onHide');
  });

  return (
    <SimulatorProvider>
      {props.children}
    </SimulatorProvider>
  );
}

export default App;
