import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: {
    title: 'PURETAP API',
    description: 'API Documentation'
  },
  host: 'localhost:5000',
  schemes: ['http']
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['../app.js']

swaggerAutogen()(outputFile, endpointsFiles, doc)