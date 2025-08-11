// Mock for pdfjs-dist to fix Jest test issues
const mockPdfjsLib = {
  GlobalWorkerOptions: {
    workerSrc: '/pdf.worker.min.mjs'
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Mock PDF content' }]
        }))
      }))
    })
  }))
};

module.exports = mockPdfjsLib;
