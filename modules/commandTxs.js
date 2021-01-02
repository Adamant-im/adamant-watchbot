const Store = require('../modules/Store');
const $u = require('../helpers/utils');
const config = require('./configReader');
const log = require('../helpers/log');
const notify = require('../helpers/notify');

const timeToConfirm = 1000 * 60 * 10; // 10 minutes to confirm
let pendingConfirmation = {
	command: '',
	timestamp: 0
}

module.exports = async (cmd, tx, itx) => {

	if (itx && itx.isProcessed) return;
	log.info('Got new command Tx to process: ' + cmd);
	try {
		let res = [];
		const group = cmd
			.trim()
			.replace(/    /g, ' ')
			.replace(/   /g, ' ')
			.replace(/  /g, ' ')
			.split(' ');
		const methodName = group.shift().trim().toLowerCase().replace('\/', '');
		const m = commands[methodName];
		if (m) {
			res = await m(group, tx);
		} else {
			res.msgSendBack = `I don’t know */${methodName}* command. ℹ️ You can start with **/help**.`;
		}
		if (!tx) {
			return res.msgSendBack;
		}
		if (tx) {
            if (itx) itx.update({isProcessed: true}, true);
            if (res.msgNotify)
                notify(res.msgNotify, res.notifyType);
            if (res.msgSendBack)
                $u.sendAdmMsg(tx.senderId, res.msgSendBack);
        }
	} catch (e) {
		tx = tx || {};
		log.error('Error while processing command ' + cmd + ' from senderId ' + tx.senderId + '. Tx Id: ' + tx.id + '. Error: ' + e);
	}
}

function y(params, tx) {
	try {
		if (pendingConfirmation.command) {
			if (Date.now() - pendingConfirmation.timestamp > timeToConfirm) {
				return {
					msgNotify: '',
					msgSendBack: `I will not confirm command ${pendingConfirmation.command} as it is expired. Try again.`,
					notifyType: 'log'
				}
			} else {
				module.exports(`${pendingConfirmation.command} -y`, tx);
				return {
					msgNotify: '',
					msgSendBack: '',
					notifyType: 'log'
				}
			}
		} else {
			return {
				msgNotify: '',
				msgSendBack: `There is no pending command to confirm.`,
				notifyType: 'log'
			}
		}
	} catch (e) {
		log.error(`Error in y()-confirmation of ${$u.getModuleName(module.id)} module: ` + e);
	}
	pendingConfirmation.command = '';
}

function help() {

	let output = `I am **online** and watching transactions.`;

	return {
		msgNotify: ``,
		msgSendBack: `${output}`,
		notifyType: 'log'
	}

}

async function rates(params) {

	let output = '';
	const pairObj = $u.getPairObj(params[0], true);
	const pair = pairObj.pair;
	const coin1 = pairObj.coin1;
	const coin2 = pairObj.coin2;
	const coin1Decimals =  pairObj.coin1Decimals;
	const coin2Decimals =  pairObj.coin2Decimals;

	if (!coin1 || !coin1.length) {
		output = 'Please specify coin ticker or specific market you are interested in. F. e., */rates ADM* or */rates ETH/BTC*.';
		return {
			msgNotify: ``,
			msgSendBack: `${output}`,
			notifyType: 'log'
		}	
	}
	const currencies = Store.currencies;
	const res = Object
		.keys(Store.currencies)
		.filter(t => t.startsWith(coin1 + '/'))
		.map(t => {
			let p = `${coin1}/**${t.replace(coin1 + '/', '')}**`;
			return `${p}: ${currencies[t]}`;
		})
		.join(', ');

	if (!res.length) {
		if (!pair) {
			output = `I can’t get rates for *${coin1} from Infoservice*. Try */rates ADM*.`;
			return {
				msgNotify: ``,
				msgSendBack: `${output}`,
				notifyType: 'log'
			}
		}
	} else {
		output = `Global market rates for ${coin1}:\n${res}.`;
	}

	return {
		msgNotify: ``,
		msgSendBack: `${output}`,
		notifyType: 'log'
	}

}

async function calc(arr) {

	if (arr.length !== 4) {
		return {
			msgNotify: ``,
			msgSendBack: 'Wrong arguments. Command works like this: */calc 2.05 BTC in USDT*.',
			notifyType: 'log'
		}
	}

	let output = '';
	const amount = +arr[0];
	const inCurrency = arr[1].toUpperCase().trim();
	const outCurrency = arr[3].toUpperCase().trim();
	let pair = inCurrency + '/' + outCurrency;
	let pair2 = outCurrency + '/' + inCurrency;

	if (!amount || amount === Infinity) {
		output = `It seems amount "*${amount}*" for *${inCurrency}* is not a number. Command works like this: */calc 2.05 BTC in USDT*.`;
		return {
			msgNotify: ``,
			msgSendBack: `${output}`,
			notifyType: 'log'
		}
	}
	if (!$u.isHasTicker(inCurrency)) {
		output = `I don’t have rates of crypto *${inCurrency}* from Infoservice. Made a typo? Try */calc 2.05 BTC in USDT*.`;
	}
	if (!$u.isHasTicker(outCurrency)) {
		output = `I don’t have rates of crypto *${outCurrency}* from Infoservice. Made a typo? Try */calc 2.05 BTC in USDT*.`;
	}

	let result;
	if (!output) {
		result = Store.mathEqual(inCurrency, outCurrency, amount, true).outAmount;
		if (amount <= 0 || result <= 0 || !result) {
			output = `I didn’t understand amount for *${inCurrency}*. Command works like this: */calc 2.05 BTC in USDT*.`;
			return {
				msgNotify: ``,
				msgSendBack: `${output}`,
				notifyType: 'log'
			}
		}
		if ($u.isFiat(outCurrency)) {
			result = +result.toFixed(2);
		}
		output = `Global market value of ${$u.thousandSeparator(amount)} ${inCurrency} equals **${$u.thousandSeparator(result)} ${outCurrency}**.`;
	} else {
		output = '';
	}

	return {
		msgNotify: ``,
		msgSendBack: `${output}`,
		notifyType: 'log'
	}

}

function version() {
	return {
		msgNotify: ``,
		msgSendBack: `I am running on _adamant-watchbot_ software version _${Store.version}_. Revise code on ADAMANT's GitHub.`,
		notifyType: 'log'
	}
}

const commands = {
	help,
	rates,
	calc,
	version,
	y
}