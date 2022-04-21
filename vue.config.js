module.exports = {
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    },
    detail: {
      template: 'public/browser-extension.html',
      entry: './src/detail/main.js',
      title: 'Detail'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
        contentScripts: {
          entries: {
            content1: 'src/content-script1.js'
          }
        }
      }
    }
  }
}
