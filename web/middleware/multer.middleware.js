const multer = require('multer');
const uuid = require('uuid/v1');

const batchStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './uploads');
  },
  filename(req, file, cb) {
    // remove extension of the file and append timestamp to make it unique
    // this fileName will be stored as batch_id in batch collection
    // const filename = `${file.originalname.slice(0, -5)}-${Date.now()}.xlsx`;
    const filename = `${uuid()}.xlsx`;
    cb(null, filename);
  },
});

const batchFileFilter = (req, file, cb) => {
  if ((file.originalname).indexOf('.xlsx') >= 0) {
    cb(null, true);
  } else {
    logger.error('Invalid File Type Uploaded');
    cb(null, false);
  }
};
/*
 * Single file upload
 * An object with a of file will be stored in req.file.
 */
const historyData = multer({
  storage: batchStorage,
  fileFilter: batchFileFilter,
}).single('datafile');

module.exports = { historyData };