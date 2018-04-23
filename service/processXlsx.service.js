const Boom = require('boom');
const XLSX = require('xlsx');

/* Generic Service to parse any XLSX document,
 * Simply pass it's path from root and filename.
 */
module.exports = (input, sheetNames) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = input.path + input.filename;
      const workbook = XLSX.readFile(getFilePath(filePath), { cellDates: true });
      // only use sheetName if provided
      const sheets = sheetNames || workbook.SheetNames[0];
      const worksheets = [];
      sheets.forEach((sheet) => {
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { raw: true });
        worksheets[sheet] = worksheet;
      });
      resolve(worksheets);
    } catch (err) {
      reject(Boom.badRequest(err));
    }
  });
};