export const ACCOUNT_NO_CONFIG = {
  prefix: 'GT',       // change this to anything e.g. 'PT', 'GW', 'GITARU'
  digits: 5,          // how many digits e.g. 5 = 00001, 4 = 0001
  separator: '-'      // separator between prefix and number
}

export const INVOICE_NO_CONFIG = {
  prefix: 'INV',        // change to anything e.g. 'PT', 'PURETAP', 'GTWR'
  include_year: true,   // set false to remove year from format
  digits: 5,            // how many digits e.g. 5 = 00001, 4 = 0001
  separator: '-'        // separator between parts
}