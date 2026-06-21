import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { SimulatorProvider } from './store/SimulatorContext';
import { mockResults } from './data/mockTasks';
// 全局样式
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] Initialized with mock data');
  }, []);

  useDidShow(() => {
    console.log('[App] onShow');
  });

  useDidHide(() => {
    console.log('[App] onHide');
  });

  return (
    <SimulatorProvider initialResults={mockResults}>
      {props.children}
    </SimulatorProvider>
  );
}

export default App;
