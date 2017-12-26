/**
 * Processes:
 * - saves to batch collection, only unique combined with client has to be saved
 * - validates the payments
 * - saves the respective payments, only unique combined with client as to be saved
 * - updates the batch collection
 * - Also create beneficiary and remitter on the fly
 * also saves individual transactions
 * @param {any} body
 * @param {any} context
 */
function* logic({ body, context }) {
  let savedBatch = {};
  try {
    const _transactionDAO = transactionDAO();
    const _batchDAO = batchDAO();
    const _beneficiaryDAO = beneficiaryDAO();
    const _remitterDAO = remitterDAO();
    const payoutArray = [];
    const txnsInBatches = {};
    let accountsForBatch = null;
    // get list of accounts
    if (body.source === 'BATCH') {
      accountsForBatch = yield getAccountMap(body.accounts,
        body.clientId); // throws Custom Error
    }
    // saving batch
    const fileDoc = getters.getFileObject(body, context.user._id, body.clientId);
    savedBatch = yield _batchDAO.saveUnique(fileDoc);

    // saving transactions
    for (const v of body.transactions) { // eslint-disable-line
      const store = enrichStoreObject(v, body.source);
      const data = yield getters.getTransactionObject({
        batchId: savedBatch._id,
        store: store,
        userId: context.user._id,
        clientId: body.clientId,
      });
      payoutArray.push(data);
    }

    //eslint-disable-next-line
    const errorTransactions = [];
    const accountsInBatch = {};
    const accountsInBatchArray = [];
    // transactions insert sequencially to maintain the order
    // eslint-disable-next-line
    for (const v of payoutArray) {
      try {
        if (txnsInBatches[v.store.transaction_number] != null) {
          v.is_duplicate = true;
          throw new ERROR.ValidationError('Repeated transaction number in same batch.');
        }
        txnsInBatches[v.store.transaction_number] = 1;
        // first define the source of transaction
        if (_.isEmpty(body.source)) {
          throw new ERROR.ValidationError('Transaction upload source is required.');
        } else if (['MANUAL', 'API', 'BATCH'].indexOf(body.source) === -1) {
          throw new ERROR.ValidationError(`Invalid source for transaction upload. Value: ${body.source}`);
        }
        v.source = body.source;

        // check for duplicate transaction number
        const duplicateCheck = yield _transactionDAO.duplicateTransaction(v.store.transaction_number, body.clientId);

        if (duplicateCheck.is_Duplicate) {
          v.is_duplicate = true;
          throw new ERROR.ValidationError(duplicateCheck.description);
        }

        // ***** removed the comment from bottom line

        // XLSX Validations here
        // validateBatch(Object.assign({}, v.store));

        const validationResponse = yield validateTransaction(Object.assign({},
          v.store), v.source);
        if (validationResponse.messages && validationResponse.messages.length > 0) {
          // throw error with messages in array in response joined
          const message = validationResponse.messages.join(',');
          throw new ERROR.ValidationError(message);
        }

        // ******* Comment for FIX TO GO NEXT SPRINT ****** //

        // Save extra details for equivalent bookFx case
        if (v.store.destination_amount === 0 && v.store.equivalent_amount > 0) {
          // const obj = yield getDestinationAmount(v.store, v.client);
          // v.instarem_fx_rate = obj.instarem_fx_rate;
          // v.fx_rate = obj.fx_rate;
          // v.fx_provider = obj.fx_provider;
          // v.margin_percent = obj.margin_percent;
          // v.margin_value = obj.margin_value;
          // v.margin_currency = obj.margin_currency;
          // v.store.destination_amount = obj.destinationAmount;
          v.store.destination_amount = yield getDestinationAmount(v.store, v.client);
        }

        // enrich GBP,USD,EUR,JPY rates
        // const rates = yield helpers.getEquivalentRates(v.store.destination_currency, v.store.destination_amount);
        // v = Object.assign({}, v, rates);
        // getters.enrichRates(v, rates);

        // generation of beneficiary alias
        let beneficiaryAlias;
        const firstName = v.store.beneficiary_name.split(' ')[0];
        let initialBeneficiaryAlias = v.store.beneficiary_alias || firstName;
        if (v.store.beneficiary_alias === '') {
          initialBeneficiaryAlias = firstName;
        }

        const client = mongoose.Types.ObjectId(body.clientId);
        const distinctAlias = yield beneficiaryDAO().distinct('beneficiary_alias', { client });
        const isAliasValid = validateIfUniqueAlias(initialBeneficiaryAlias, distinctAlias);
        if (!isAliasValid) {
          beneficiaryAlias = assignUniqueAlias(initialBeneficiaryAlias, distinctAlias);
        } else {
          beneficiaryAlias = initialBeneficiaryAlias;
        }

        // create beneficiary and remitter corresponding to a transaction
        const values = yield [
          _beneficiaryDAO.findAndCreate({
            beneficiary_name: v.store.beneficiary_name,
            beneficiary_account_number: v.store.beneficiary_account_number,
            beneficiary_bank_name: v.store.beneficiary_bank_name,
            client: body.clientId,
          }, getters.getBeneficiaryObject(v.store, context.system._id, body.clientId, beneficiaryAlias)),
          _remitterDAO.findAndCreate({
            remitter_name: v.store.remitter_name,
            remitter_identification_type: v.store.remitter_identification_type,
            remitter_identification_number: v.store.remitter_identification_number,
            client: body.clientId,
          }, getters.getRemitterObject(v.store, context.system._id, body.clientId)),
        ];

        // set accounts from which deduction has to happen
        if (body.source === 'BATCH') {
          if (accountsForBatch[v.store.destination_currency] == null) {
            throw new ERROR.ValidationError(`No Default Account found for ${v.store.destination_currency}`);
          } else if (accountsInBatch[v.store.destination_currency] == null) {
            accountsInBatch[v.store.destination_currency] = true;
            accountsInBatchArray.push(accountsForBatch[v.store.destination_currency]);
          }
          v.account = accountsForBatch[v.store.destination_currency].account;
        } else if (body.source === 'MANUAL') {
          const accountObj = yield getAccountById({ id: v.store.accountId });
          accountsInBatch[v.store.accountId] = true;
          accountsInBatchArray.push({
            account: accountObj[0].id,
            account_number: accountObj[0].account_number,
            currency: accountObj[0].currency,
          });
          v.account = v.store.accountId;
          // find out now currency from country code and set to local_conversion_currency
          const localCountryCode = yield getCurrencyCodeByCountry(values[0].beneficiary_country_code);
          v.store.local_conversion_currency = localCountryCode.currency_label;
          v.store.destination_currency = accountObj[0].currency;
        }

        v.beneficiary = values[0].id;
        v.remitter = values[1].id;
        if (body.source !== 'BATCH') {
          delete v.store.accountId;
        }
        yield _transactionDAO.saveUnique(v, errorTransactions, context);
      } catch (e) {
        if (body.source !== 'BATCH') {
          v.account = v.store.accountId;
          accountsInBatchArray.push(v.store.accountId);
          delete v.store.accountId;
        }
        if (isNaN(Number(v.store.destination_amount))) {
          // destination amount changed to 0 if it is not a number.
          v.store.destination_amount = 0.00;
        }
        errorTransactions.push(v.transaction_number);
        v.status = 'ERROR';
        if (e instanceof ERROR.ValidationError) {
          v.sub_status = 'DATA ERROR';
          v.status_logs = [{
            status: 'ERROR',
            sub_status: 'DATA ERROR',
            created_by: context.user._id,
            description: `Validation Error: ${e.message}`,
          }];
        } else if (e instanceof ERROR.CustomError && e.name === 'CoversionError') {
          v.sub_status = 'CONVERSION ERROR';
          v.status_logs = [{
            status: 'ERROR',
            sub_status: 'CONVERSION ERROR',
            created_by: context.user._id,
            description: `Conversion Error: ${e.message}`,
          }];
        } else if (e instanceof ERROR.CustomError && e.name === 'ValidationServiceError') {
          v.sub_status = 'UPLOAD ERROR';
          v.status_logs = [{
            status: 'ERROR',
            sub_status: 'UPLOAD ERROR',
            created_by: context.user._id,
            description: `Validation Service Error: ${e.message}`,
          }];
        } else {
          v.sub_status = 'UPLOAD ERROR';
          v.status_logs = [{
            status: 'ERROR',
            sub_status: 'UPLOAD ERROR',
            created_by: context.user._id,
            description: `Validation Error: ${e.message}`,
          }];
        }
        // saving error transactions
        yield _transactionDAO.save(v);
      }
    }

    const insertedCount = payoutArray.length - errorTransactions.length;
    if (insertedCount !== 0) {
      yield _batchDAO.findByIdAndUpdate(savedBatch._id, {
        status: 'APPROVAL_PENDING',
        accounts: accountsInBatchArray,
        transaction_count: payoutArray.length,
        $push: {
          status_logs: {
            status: 'APPROVAL_PENDING',
            created_by: context.system._id,
            description: 'Transactions Uploaded',
          },
        },
        $inc: { 'counter.APPROVAL_PENDING': insertedCount, 'counter.ERROR': errorTransactions.length },
      }, {
        safe: true,
      });
    } else {
      yield _batchDAO.findByIdAndUpdate(savedBatch._id, {
        status: 'ERROR',
        accounts: accountsInBatchArray,
        transaction_count: payoutArray.length,
        $push: {
          status_logs: {
            status: 'ERROR',
            created_by: context.system._id,
            description: 'No valid transaction in batch to proccess',
          },
        },
        $inc: { 'counter.ERROR': errorTransactions.length },
      }, {
        safe: true,
      });
    }

    if (insertedCount !== 0) {
      yield _batchDAO.findByIdAndUpdate(savedBatch._id, {
        status: 'IN_PROCESS',
      });

      co(processes.combined({
        batch_id: savedBatch._id,
        context,
        stage: 'ON_UPLOAD',
      })).then(() => {
        logger.debug('process complete');
        _batchDAO.findByIdAndUpdate(savedBatch._id, {
          status: 'APPROVAL_PENDING',
        });
      }).catch((err) => logger.error(`error in process ${err.message}`));
    }

    return {
      insertedCount,
      errorCount: errorTransactions.length,
      errorTransactions,
    };
  } catch (e) {
    // body.transactions
    logger.error(`Unable to Upload Batch ${e}`, { file: 'batchUpload.handler.js', function: 'logic' });
    let updateQuery = null;
    if (e instanceof ERROR.CustomError && e.name === 'generateTransactionIdError') {
      updateQuery = {
        status: 'ERROR',
        $push: {
          status_logs: {
            status: 'ERROR',
            created_by: context.system._id,
            description: e.message,
          },
        },
        $inc: { 'counter.ERROR': body.transactions.length },
      };
    } else {
      updateQuery = {
        status: 'ERROR',
        $push: {
          status_logs: {
            status: 'ERROR',
            created_by: context.system._id,
            description: 'Error while uploading batch.',
          },
        },
        $inc: { 'counter.ERROR': body.transactions.length },
      };
    }

    yield batchDAO().findByIdAndUpdate(savedBatch._id, updateQuery, {
      safe: true,
    });
    throw new ERROR.ApplicationError('unable to save batch');
  }
}

function handler(req, res, next) {
  return true; // under development
  co(logic(req))
    .then((data) => {
      res.json({
        success: true,
        data,
      });
    })
    .catch(err => next(err));
}
module.exports = handler;