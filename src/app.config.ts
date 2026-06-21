export default defineAppConfig({
  pages: [
    'pages/tasks/index',
    'pages/simulator/index',
    'pages/results/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5FA8',
    navigationBarTitleText: '周转件借还模拟',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5FA8',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '任务列表'
      },
      {
        pagePath: 'pages/simulator/index',
        text: '模拟操作'
      },
      {
        pagePath: 'pages/results/index',
        text: '成绩回放'
      }
    ]
  }
})
